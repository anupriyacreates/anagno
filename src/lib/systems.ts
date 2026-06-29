import type { Node, Edge } from "@xyflow/react";
import type { Loop, LeveragePoint, Sign } from "../types";

// Bounds that keep cycle enumeration responsive on real canvases.
const MAX_LEN = 8;
const MAX_LOOPS = 40;
const STEP_BUDGET = 200_000;

interface Arc {
  to: string;
  sign: Sign;
}

function titleOf(node: Node | undefined): string {
  if (!node) return "node";
  const d = node.data as { title?: string; text?: string } | undefined;
  const raw = (d?.title ?? d?.text ?? "").toString().trim();
  if (!raw) return "untitled";
  return raw.length > 40 ? raw.slice(0, 39) + "…" : raw;
}

function signOf(e: Edge): Sign {
  const s = (e.data as { sign?: Sign } | undefined)?.sign;
  return s === "-" ? "-" : "+";
}

export interface SystemAnalysis {
  loops: Loop[];
  leverage: LeveragePoint[];
}

/** Pure, deterministic analysis of the signed causal graph: feedback loops + leverage. */
export function analyzeSystem(nodes: Node[], edges: Edge[]): SystemAnalysis {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, Arc[]>();
  const outDeg = new Map<string, number>();
  const inDeg = new Map<string, number>();

  for (const e of edges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push({ to: e.target, sign: signOf(e) });
    outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  // ---- detect simple directed cycles (bounded) ----
  const loops: Loop[] = [];
  const seen = new Set<string>();
  let steps = 0;

  function canonical(path: string[]): string {
    let min = 0;
    for (let i = 1; i < path.length; i++) if (path[i] < path[min]) min = i;
    return [...path.slice(min), ...path.slice(0, min)].join("→");
  }

  function dfs(start: string, current: string, path: string[], negatives: number) {
    if (loops.length >= MAX_LOOPS || steps > STEP_BUDGET) return;
    for (const arc of adj.get(current) ?? []) {
      steps++;
      if (arc.to === start && path.length >= 2) {
        const neg = negatives + (arc.sign === "-" ? 1 : 0);
        const key = canonical(path);
        if (!seen.has(key)) {
          seen.add(key);
          loops.push({
            id: key,
            members: [...path],
            negatives: neg,
            type: neg % 2 === 0 ? "R" : "B",
            label: path.map((id) => titleOf(nodeById.get(id))).join(" → "),
          });
          if (loops.length >= MAX_LOOPS) return;
        }
      } else if (
        arc.to !== start &&
        !path.includes(arc.to) &&
        path.length < MAX_LEN
      ) {
        dfs(start, arc.to, [...path, arc.to], negatives + (arc.sign === "-" ? 1 : 0));
      }
    }
  }

  for (const n of nodes) {
    if (loops.length >= MAX_LOOPS || steps > STEP_BUDGET) break;
    dfs(n.id, n.id, [n.id], 0);
  }

  // ---- leverage ranking ----
  const loopCount = new Map<string, number>();
  for (const lp of loops) {
    for (const id of lp.members) loopCount.set(id, (loopCount.get(id) ?? 0) + 1);
  }

  const leverage: LeveragePoint[] = nodes
    .map((n) => {
      const loopsIn = loopCount.get(n.id) ?? 0;
      const out = outDeg.get(n.id) ?? 0;
      const inc = inDeg.get(n.id) ?? 0;
      const score = loopsIn * 3 + out * 1.5 + inc;
      const parts: string[] = [];
      if (loopsIn) parts.push(`in ${loopsIn} loop${loopsIn > 1 ? "s" : ""}`);
      if (out) parts.push(`${out} outgoing`);
      if (inc) parts.push(`${inc} incoming`);
      return {
        nodeId: n.id,
        title: titleOf(n),
        score,
        reason: parts.join(" · ") || "no connections yet",
      };
    })
    .filter((l) => l.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return { loops, leverage };
}
