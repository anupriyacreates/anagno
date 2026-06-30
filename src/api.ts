import type {
  DiveResponse,
  ScanResponse,
  FrameworkDef,
  ChatMessage,
  RawFinding,
} from "./types";
import { DEMO_MODE } from "./demo/demoMode";
import * as mock from "./demo/mockApi";

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface ExistingNode {
  title: string;
  category: string;
}

export function diveFramework(
  context: string,
  framework: FrameworkDef,
  existingNodes: ExistingNode[],
  focus?: string,
): Promise<DiveResponse> {
  if (DEMO_MODE) return mock.diveFrameworkMock(context, framework, existingNodes, focus);
  return postJSON<DiveResponse>("/api/dive", {
    context,
    framework: { name: framework.name, description: framework.description },
    existingNodes,
    focus,
  });
}

export function scanPatterns(
  context: string,
  nodes: ExistingNode[],
  focus?: string,
): Promise<ScanResponse> {
  if (DEMO_MODE) return mock.scanPatternsMock(context, nodes, focus);
  return postJSON<ScanResponse>("/api/scan", { context, nodes, focus });
}

/** Stream a chat reply; `onToken` is called with each text chunk as it arrives. */
export async function streamChat(
  payload: { context: string; messages: ChatMessage[]; nodes: ExistingNode[] },
  onToken: (chunk: string) => void,
): Promise<void> {
  if (DEMO_MODE) return mock.streamChatMock(payload, onToken);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    let msg = `Chat failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onToken(text);
  }
}

export function extractNodes(
  context: string,
  text: string,
  nodes: ExistingNode[],
): Promise<{ findings: RawFinding[] }> {
  if (DEMO_MODE) return mock.extractNodesMock(context, text, nodes);
  return postJSON<{ findings: RawFinding[] }>("/api/extract", {
    context,
    text,
    nodes,
  });
}

export function getFollowups(
  context: string,
  messages: ChatMessage[],
  nodes: ExistingNode[],
): Promise<{ suggestions: string[] }> {
  if (DEMO_MODE) return mock.getFollowupsMock(context, messages, nodes);
  return postJSON<{ suggestions: string[] }>("/api/followups", {
    context,
    messages,
    nodes,
  });
}

export interface UnfurlResult {
  kind: "video" | "link";
  url: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  embed?: string;
}

export function unfurl(url: string): Promise<UnfurlResult> {
  if (DEMO_MODE) return mock.unfurlMock(url);
  return postJSON<UnfurlResult>("/api/unfurl", { url });
}
