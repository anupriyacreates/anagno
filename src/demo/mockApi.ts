// Mock implementations of every src/api.ts call, used when DEMO_MODE is on.
// Each mirrors the real function's signature and return shape, adds a little
// simulated latency so loaders/streaming feel live, and pulls from fixtures.ts.

import type {
  DiveResponse,
  ScanResponse,
  FrameworkDef,
  ChatMessage,
  RawFinding,
} from "../types";
import type { ExistingNode, UnfurlResult } from "../api";
import {
  DIVE_FIXTURES,
  genericDive,
  SCAN_FIXTURE,
  EXTRACT_FINDINGS,
  FOLLOWUP_POOL,
  chatReplyFor,
  makeUnfurl,
} from "./fixtures";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

export async function diveFrameworkMock(
  _context: string,
  framework: FrameworkDef,
  existingNodes: ExistingNode[],
  focus?: string,
): Promise<DiveResponse> {
  await sleep(jitter(750, 600));
  const fx = DIVE_FIXTURES[framework.id] ?? genericDive(framework);
  const findings = fx.findings.map((f) => ({ ...f, connectsTo: [...f.connectsTo] }));

  // Wire the last finding to an existing canvas node so cross-lens edges appear.
  if (existingNodes.length && findings.length) {
    findings[findings.length - 1] = {
      ...findings[findings.length - 1],
      connectsTo: [existingNodes[0].title],
      connectionType: "feeds into",
    };
  }

  const intro = focus?.trim()
    ? `On "${focus.trim()}" through the ${framework.name} lens — ${fx.intro}`
    : fx.intro;
  return { intro, findings };
}

export async function scanPatternsMock(
  _context: string,
  nodes: ExistingNode[],
  focus?: string,
): Promise<ScanResponse> {
  await sleep(jitter(1000, 700));
  const titles = nodes.map((n) => n.title);
  const insights: RawFinding[] = SCAN_FIXTURE.insights.map((ins, i) => {
    const linked = titles.slice(i, i + 2);
    return {
      ...ins,
      connectsTo: linked.length ? linked : [...ins.connectsTo],
    };
  });
  const intro = focus?.trim()
    ? `Following your hunch — ${SCAN_FIXTURE.intro}`
    : SCAN_FIXTURE.intro;
  return { intro, insights };
}

export async function streamChatMock(
  payload: { context: string; messages: ChatMessage[]; nodes: ExistingNode[] },
  onToken: (chunk: string) => void,
): Promise<void> {
  const lastUser = [...payload.messages].reverse().find((m) => m.role === "user");
  const reply = chatReplyFor(lastUser?.content ?? "");
  await sleep(jitter(300, 250)); // "thinking" beat before the first token
  const tokens = reply.match(/\S+\s*|\s+/g) ?? [reply];
  for (const t of tokens) {
    onToken(t);
    await sleep(jitter(16, 42));
  }
}

export async function extractNodesMock(
  _context: string,
  _text: string,
  _nodes: ExistingNode[],
): Promise<{ findings: RawFinding[] }> {
  await sleep(jitter(650, 450));
  return { findings: EXTRACT_FINDINGS.map((f) => ({ ...f, connectsTo: [...f.connectsTo] })) };
}

export async function getFollowupsMock(
  _context: string,
  messages: ChatMessage[],
  _nodes: ExistingNode[],
): Promise<{ suggestions: string[] }> {
  await sleep(jitter(400, 300));
  const start = messages.length % FOLLOWUP_POOL.length;
  const suggestions = [0, 1, 2].map(
    (i) => FOLLOWUP_POOL[(start + i) % FOLLOWUP_POOL.length],
  );
  return { suggestions };
}

export async function unfurlMock(url: string): Promise<UnfurlResult> {
  await sleep(jitter(500, 350));
  return makeUnfurl(url);
}
