# Anagno — Systems Model (spec)

Anagno is repositioning from a generic "AI research canvas" to **an AI-native tool for
studying multi-actor systems**. The moat is **the model itself**: a persistent,
inspectable, evidence-grounded graph of actors and feedback that the AI helps build and
the human governs — something neither a generic canvas (Miro), a research repository
(Dovetail), nor a chat agent can hold.

This document is the spine: entities, relationships, derived analysis, provenance, and
the AI co-modeling contract. The next build step refactors `src/types.ts` to these shapes
and implements loop detection + leverage analysis behind "Scan."

---

## 1. Design principles
- **Two layers, one graph.** A *causal layer* (factors linked by signed cause→effect) and
  an *actor layer* (players linked by relationships). Loops live in the causal layer;
  power/influence lives in the actor layer; actors link into factors
  ("Actor influences Factor").
- **The model is the product, not the chat.** AI proposes; the human curates
  (keep / tweak / toss). Nothing mutates silently.
- **Grounded over plausible.** Every element can cite evidence and carries a confidence;
  AI-only hypotheses are visibly flagged.
- **Honest rigor.** Qualitative/directional analysis first (loops, leverage, propagation);
  no fake quantitative simulation.

## 2. Entities (nodes)
- **Actor** — a player in the system. `id, name, type (individual | org | group |
  institution | role | segment), description, goals[], power (low|med|high),
  interest (low|med|high), stance (ally|blocker|neutral|mixed), resources[], tags[],
  evidence[]`.
- **Factor** — a system variable that can rise/fall. `id, name, kind (stock | flow |
  variable | condition), scale (qualitative or unit), description, tags[], evidence[]`.
- **Evidence** — a grounding research artifact (extends today's "finding"). `id, kind
  (quote | doc | link | interview | datum), content, source, url?, capturedAt`.
- **Intervention / Leverage point** — a candidate action on the system. `id, label,
  target (factorId | loopId), meadowsLevel (1–12), expectedEffect, effort (low|med|high),
  confidence, evidence[]`.
- **Boundary / Subsystem** (optional) — grouping + in/out-of-scope marker. `id, name,
  members[]`.

## 3. Relationships (edges) — typed, directional, signed
A directed edge `source → target` with:
- **family:** `causal` (factor→factor) or `relational` (actor→actor or actor→factor).
- **type:** causal → `increases | decreases | enables | constrains`; relational →
  `funds | supplies | regulates | competes | collaborates | depends-on | informs |
  trusts | controls`.
- **polarity / sign:** `+` (moves same way) / `−` (moves opposite) — **causal links
  only**; this is what drives loop detection.
- **strength:** low | med | high (or 0–1).
- **delay:** none | short | long (delays change system behavior).
- **confidence:** 0–1.
- **evidence[]:** Evidence ids (provenance + rationale).

> Today's connection types (`causes / contradicts / supports / amplifies / feeds into`)
> map onto this: causes → `increases(+)`, amplifies → `increases(+)` strong,
> contradicts → `decreases(−)` / tension flag, supports → `enables`,
> feeds into → `increases(+)`.

## 4. Feedback loops (derived, auto-detected)
- A **loop** = a directed cycle in the causal graph.
- **Polarity rule:** count `−` links in the cycle → even ⇒ **Reinforcing (R)**,
  odd ⇒ **Balancing (B)**. Computed automatically.
- `id, members (ordered linkIds), type (R|B), label, dominanceScore (∏ or min of
  strengths), narrative`.
- Loops are the heart of the model; surfacing R/B loops + the likely **dominant loop** is
  a headline output.

## 5. Analysis engine (the opinionated value)
1. **Loops:** reinforcing/balancing loops + plain-language narrative; flag dominant loop(s).
2. **Leverage points:** map factors/loops to **Meadows' 12 levels** (parameters → buffers →
   feedback → rules → goals → paradigm); rank interventions by
   `leverage × feasibility × confidence`. Surface "small change → big effect" spots.
3. **Actor analysis:** power/interest grid (manage-closely / keep-satisfied /
   keep-informed / monitor); influence metrics from the relational graph (degree,
   betweenness → brokers); alignment/tension map (stance + conflicting links).
4. **Tensions / contradictions:** conflicting links or evidence on the same pair.
5. **Blind spots:** factors with no inputs, actors with no goals, ungrounded hypotheses,
   unclosed loops — "what the model is missing."

## 6. Interrogation / light simulation (scoped honestly)
- **Qualitative propagation:** nudge a factor ↑/↓ → propagate signs along causal links
  (bounded hops / until a loop) → show which factors rise/fall and which loops amplify or
  damp. Labeled **directional, not quantitative.**
- **Scenario:** "what if Actor X's power ↑ / this link strengthens" → which links activate,
  which loops strengthen, likely system response.
- **Out of scope (v1):** true stock-and-flow numerical simulation (a later deep-end).

## 7. AI co-modeling contract
- **Input:** a brief, a question, or dropped research (transcript / notes / links).
- **Propose:** AI suggests actors, factors, signed links, candidate loops, leverage points
  — each as a *pending* item with evidence + confidence.
- **Curate:** items flow through the existing **keep / tweak / toss** queue; the human
  governs the model. AI may also flag blind spots and propose missing actors/links.
- **Re-run:** as new evidence lands, AI proposes diffs; the model is living.

## 8. Trust & provenance
Every Actor / Factor / Link / Intervention may cite Evidence; the UI distinguishes
evidence-backed from AI-hypothesis (`grounded` flag) and shows a confidence level. The
output is a model you can defend, not vibes.

## 9. Data shapes (TypeScript reference — to land in `src/types.ts`)
```ts
type Power = "low" | "med" | "high";

interface Evidence {
  id: string;
  kind: "quote" | "doc" | "link" | "interview" | "datum";
  content: string;
  source?: string;
  url?: string;
  capturedAt?: string;
}

interface Actor {
  id: string;
  name: string;
  type: "individual" | "org" | "group" | "institution" | "role" | "segment";
  goals: string[];
  power: Power;
  interest: Power;
  stance: "ally" | "blocker" | "neutral" | "mixed";
  resources?: string[];
  description?: string;
  tags?: string[];
  evidence: string[];
}

interface Factor {
  id: string;
  name: string;
  kind: "stock" | "flow" | "variable" | "condition";
  scale?: string;
  description?: string;
  tags?: string[];
  evidence: string[];
}

interface Link {
  id: string;
  source: string;
  target: string;
  family: "causal" | "relational";
  type: string; // causal: increases|decreases|enables|constrains; relational: funds|regulates|...
  sign?: "+" | "-"; // causal links only
  strength: Power;
  delay: "none" | "short" | "long";
  confidence: number; // 0..1
  evidence: string[];
}

interface Loop {
  id: string;
  members: string[]; // ordered linkIds forming the cycle
  type: "R" | "B"; // reinforcing | balancing
  label: string;
  dominanceScore: number;
  narrative: string;
}

interface Intervention {
  id: string;
  label: string;
  target: string; // factorId | loopId
  meadowsLevel: number; // 1..12
  expectedEffect: string;
  effort: Power;
  confidence: number;
  evidence: string[];
}

interface SystemModel {
  id: string;
  title: string;
  boundary?: string;
  actors: Actor[];
  factors: Factor[];
  links: Link[];
  loops: Loop[];
  interventions: Intervention[];
  evidence: Evidence[];
}
```

## 10. How it maps onto today's Anagno (reuse, not rebuild)
- `DiverNode` / finding nodes → **Evidence** + can be promoted to **Actor** / **Factor**.
- Existing typed edges → upgraded to **signed causal links** + **relational links**.
- "Scan for patterns" → the **loop detection + leverage-point** engine.
- Lens dives → re-aimed as elicitation modes: *actor map*, *factor / causal map*,
  *loop hypotheses*, *leverage points* (scoped by the query, as today).
- Keep / tweak / toss + the Surface pane → the **curation gate** for AI-proposed elements.

## 11. Open decisions (flag before build)
- Qualitative (`low/med/high`) vs numeric (0–1) weights at v1 — recommend qualitative.
- One blended graph vs an explicit two-layer toggle (actor view / causal view).
- How much interrogation in v1 — recommend qualitative propagation + scenario only.

## 12. Next build step (not this doc)
Refactor `src/types.ts` to these shapes; implement loop detection (signed-cycle polarity)
and the leverage-point ranking behind "Scan"; re-aim lens dives as actor/factor/loop
elicitation; route AI-proposed elements through the keep/tweak/toss queue with provenance.
