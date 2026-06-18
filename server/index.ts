import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import {
  DIVE_SYSTEM,
  SCAN_SYSTEM,
  DIVE_SCHEMA,
  SCAN_SCHEMA,
  EXTRACT_SYSTEM,
  EXTRACT_SCHEMA,
  FOLLOWUPS_SYSTEM,
  FOLLOWUPS_SCHEMA,
  buildDiveUser,
  buildScanUser,
  buildExtractUser,
  buildFollowupsUser,
  chatSystem,
} from "./prompts.js";

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.DIVER_MODEL ?? "claude-opus-4-8";

// In production we serve the built client (dist/) from this same server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const serveClient = fs.existsSync(distDir);

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error(
    "\n  ✗ ANTHROPIC_API_KEY is not set.\n" +
      "    Copy .env.example to .env and add your key, then restart.\n",
  );
}

const client = new Anthropic({ apiKey });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/**
 * Run a single structured-output request and return the parsed JSON object.
 * Throws on refusal or parse failure so the route can surface a clean error.
 */
async function generate(
  system: string,
  user: string,
  schema: Record<string, unknown>,
): Promise<unknown> {
  // `thinking: {type:"adaptive"}` and `output_config` are current API features
  // that this SDK version doesn't yet type. The SDK forwards body fields as-is,
  // so we build the params and cast past the stale types.
  const params = {
    model: MODEL,
    max_tokens: 8000,
    system,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema },
    },
    messages: [{ role: "user", content: user }],
  };
  const message = (await client.messages.create(
    params as unknown as Anthropic.MessageCreateParamsNonStreaming,
  )) as Anthropic.Message;

  if (message.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text content returned from the model.");
  }
  return JSON.parse(text.text);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, keyConfigured: Boolean(apiKey) });
});

// In dev (no dist/ build), opening the API port directly points you at the app.
if (!serveClient) {
  app.get("/", (_req, res) => {
    res
      .type("html")
      .send(
        `<body style="font-family:system-ui;padding:40px;color:#0f172a">
          <h1>🤿 Anagno API</h1>
          <p>This is the backend (port ${PORT}). The app runs at
          <a href="http://localhost:5173">http://localhost:5173</a>.</p>
          <p>API key configured: <strong>${apiKey ? "yes" : "no — set ANTHROPIC_API_KEY in .env"}</strong></p>
        </body>`,
      );
  });
}

// Populate one framework with 3-5 findings.
app.post("/api/dive", async (req, res) => {
  try {
    const { context, framework, existingNodes, focus } = req.body ?? {};
    if (!context || !framework?.name) {
      return res
        .status(400)
        .json({ error: "context and framework {name, description} are required." });
    }
    const user = buildDiveUser(
      String(context),
      { name: String(framework.name), description: String(framework.description ?? "") },
      Array.isArray(existingNodes) ? existingNodes : [],
      focus ? String(focus) : undefined,
    );
    const result = await generate(DIVE_SYSTEM, user, DIVE_SCHEMA);
    res.json(result);
  } catch (err) {
    console.error("/api/dive failed:", err);
    res
      .status(502)
      .json({ error: err instanceof Error ? err.message : "Dive failed." });
  }
});

// Cross-cutting pattern scan across the whole canvas.
app.post("/api/scan", async (req, res) => {
  try {
    const { context, nodes } = req.body ?? {};
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return res
        .status(400)
        .json({ error: "nodes[] is required to scan for patterns." });
    }
    const user = buildScanUser(String(context ?? ""), nodes);
    const result = await generate(SCAN_SYSTEM, user, SCAN_SCHEMA);
    res.json(result);
  } catch (err) {
    console.error("/api/scan failed:", err);
    res
      .status(502)
      .json({ error: err instanceof Error ? err.message : "Scan failed." });
  }
});

// Conversational follow-up — streams plain-text deltas back to the client.
app.post("/api/chat", async (req, res) => {
  const { context, messages, nodes } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages[] is required." });
  }
  const system = chatSystem(
    String(context ?? ""),
    Array.isArray(nodes) ? nodes : [],
  );
  const params = {
    model: MODEL,
    max_tokens: 3000,
    system,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    messages: messages.map((m: { role?: string; content?: unknown }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    })),
  };

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = client.messages.stream(
      params as unknown as Parameters<typeof client.messages.stream>[0],
    );
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(event.delta.text);
      }
      if (res.writableEnded) break;
    }
    res.end();
  } catch (err) {
    console.error("/api/chat failed:", err);
    if (!res.headersSent) {
      res
        .status(502)
        .json({ error: err instanceof Error ? err.message : "Chat failed." });
    } else {
      res.end();
    }
  }
});

// Convert a chat answer into canvas-ready findings.
app.post("/api/extract", async (req, res) => {
  try {
    const { context, text, nodes } = req.body ?? {};
    if (!text || !String(text).trim()) {
      return res
        .status(400)
        .json({ error: "text is required to extract findings." });
    }
    const user = buildExtractUser(
      String(context ?? ""),
      String(text),
      Array.isArray(nodes) ? nodes : [],
    );
    const result = await generate(EXTRACT_SYSTEM, user, EXTRACT_SCHEMA);
    res.json(result);
  } catch (err) {
    console.error("/api/extract failed:", err);
    res
      .status(502)
      .json({ error: err instanceof Error ? err.message : "Extract failed." });
  }
});

// Contextual follow-up suggestions for the chat thread.
app.post("/api/followups", async (req, res) => {
  try {
    const { context, messages, nodes } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required." });
    }
    const user = buildFollowupsUser(
      String(context ?? ""),
      messages,
      Array.isArray(nodes) ? nodes : [],
    );
    const result = await generate(FOLLOWUPS_SYSTEM, user, FOLLOWUPS_SCHEMA);
    res.json(result);
  } catch (err) {
    console.error("/api/followups failed:", err);
    res
      .status(502)
      .json({ error: err instanceof Error ? err.message : "Followups failed." });
  }
});

// Unfurl a pasted link into a preview card (or a video embed).
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
function ogTag(html: string, prop: string): string | undefined {
  const a = html.match(
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  const b = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      "i",
    ),
  );
  const v = a?.[1] ?? b?.[1];
  return v ? decodeEntities(v) : undefined;
}
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

app.post("/api/unfurl", async (req, res) => {
  const url = String(req.body?.url ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "A valid http(s) URL is required." });
  }
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt) {
    return res.json({ kind: "video", url, embed: `https://www.youtube.com/embed/${yt[1]}`, title: "YouTube", site: "youtube.com" });
  }
  if (vimeo) {
    return res.json({ kind: "video", url, embed: `https://player.vimeo.com/video/${vimeo[1]}`, title: "Vimeo", site: "vimeo.com" });
  }
  try {
    const resp = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; AnagnoBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = (await resp.text()).slice(0, 600000);
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    res.json({
      kind: "link",
      url,
      title: ogTag(html, "og:title") ?? (titleTag ? decodeEntities(titleTag.trim()) : hostOf(url)),
      description: ogTag(html, "og:description") ?? "",
      image: ogTag(html, "og:image") ?? "",
      site: ogTag(html, "og:site_name") ?? hostOf(url),
    });
  } catch {
    // Still return a usable card if fetch fails (CORS-free server side, but sites can block).
    res.json({ kind: "link", url, title: hostOf(url), description: "", image: "", site: hostOf(url) });
  }
});

// Serve the built client (production) and let client-side routing handle the rest.
if (serveClient) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n  🤿 Anagno API on http://localhost:${PORT}`);
  console.log(`     model:  ${MODEL}`);
  console.log(`     client: ${serveClient ? "serving dist/" : "dev (run vite separately)"}`);
  console.log(`     key:    ${apiKey ? "configured" : "MISSING — set ANTHROPIC_API_KEY"}\n`);
});
