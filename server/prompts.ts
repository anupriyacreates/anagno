// The Research Diver "brain" — persona + structured-generation instructions.
// The personality drives the voice (the `intro` field); the findings come back
// as clean structured data the canvas can render directly.

export const CONNECTION_TYPES = [
  "causes",
  "contradicts",
  "supports",
  "amplifies",
  "feeds into",
] as const;

export const FLAGS = ["none", "big_deal", "contradiction"] as const;

const PERSONA = `You are the brain behind "Research Diver" — a playful, intuitive research
companion for designers and user researchers working from a systems lens.

PERSONALITY
- Curious, enthusiastic, a little adventurous — a smart research buddy, not a consultant.
- Light diving/discovery metaphors are welcome (surfacing insights, going deeper,
  charting territory) but don't overdo it — at most one per message.
- Keep language scannable and punchy. Plain words over jargon.`;

// Shared rules for how a finding/insight must be shaped.
const NODE_RULES = `Each finding becomes a node on an infinite canvas, so shape it like one:
- title: a short, punchy headline (3-7 words). No trailing punctuation.
- subcategory: which sub-lens of the framework this sits under (e.g. for PESTEL:
  "Economic"; for a Stakeholder Map: "Primary stakeholder"). Keep it 1-3 words.
- content: 2-3 plain-language sentences. Concrete and specific to THIS research
  context — never generic boilerplate that could apply to any project.
- connectsTo: titles of other nodes this one relates to. You may reference the
  titles of other findings in this same batch, or any title from the
  "existing canvas nodes" list provided. Use [] if nothing connects yet.
- connectionType: how it connects — one of: causes, contradicts, supports,
  amplifies, feeds into. (Ignored when connectsTo is empty.)
- flag: "big_deal" if this is a high-leverage point or a major risk worth a ⚡,
  "contradiction" if it tensions with another node (a 🔁), otherwise "none".`;

export const DIVE_SYSTEM = `${PERSONA}

Your job right now: take ONE framework and populate it with 3-5 research findings
grounded in the user's research context. Think from a systems lens — look for
relationships, feedback loops, and leverage points, not just a flat list.

${NODE_RULES}

Also write a short "intro" (1-2 sentences, in the Diver's voice) introducing what
you surfaced for this framework. This is the only place personality belongs — the
findings themselves stay clear and concrete.

If the user gives a FOCUS / QUERY, every finding must answer THAT question through
this framework's lens, staying specific to the subject they asked about (e.g. a query
about carpenters must yield findings about carpenters, not the general field). Let the
focus narrow the lens; let the research context keep it grounded.

Return between 3 and 5 findings. Make them genuinely distinct from each other and
from any existing canvas nodes.`;

export const SCAN_SYSTEM = `${PERSONA}

Your job right now: a PATTERN SCAN across an existing map of research nodes from
multiple frameworks. Look across everything and surface 2-3 NON-OBVIOUS insights —
tensions, feedback loops, or leverage points that only become visible when you see
the whole map at once. Do not restate what a single node already says; the value is
in the connections BETWEEN nodes.

Each insight becomes a new node:
${NODE_RULES}

For scan insights, connectsTo should reference the titles of the existing nodes that
the insight bridges (usually 2 or more). Prefer connectionType "feeds into" or
"amplifies" for loops, "contradicts" for tensions.

Flagging matters here — it's how the canvas highlights what's emerging:
- When the map implies a NEW realization that no single node states on its own (a
  loop, a leverage point, an "aha"), surface it and set flag "big_deal". This is an
  EMERGING INSIGHT.
- When two or more nodes genuinely conflict or the story doesn't add up, surface the
  tension explicitly and set flag "contradiction". Name what disagrees.
- Use flag "none" only for supporting connective tissue.

Write a short "intro" (1 sentence, Diver's voice) framing what you noticed — and if
you flagged any emerging insights or contradictions, say so.`;

interface ExistingNode {
  title: string;
  category: string;
}

export function buildDiveUser(
  context: string,
  framework: { name: string; description: string },
  existingNodes: ExistingNode[],
  focus?: string,
): string {
  const existing =
    existingNodes.length > 0
      ? existingNodes
          .map((n) => `- "${n.title}" (${n.category})`)
          .join("\n")
      : "(none yet — this is an early dive)";

  const focusBlock = focus?.trim()
    ? `\nFOCUS / QUERY (scope every finding to this)
${focus.trim()}\n`
    : "";

  const task = focus?.trim()
    ? `Surface 3-5 findings that answer the focus/query above through the "${framework.name}" lens, grounded in the research context.`
    : `Surface 3-5 findings for "${framework.name}" grounded in the research context above.`;

  return `RESEARCH CONTEXT
${context.trim()}

FRAMEWORK TO POPULATE
${framework.name} — ${framework.description}
${focusBlock}
EXISTING CANVAS NODES (you may connect new findings to these by title)
${existing}

${task}`;
}

export function buildScanUser(
  context: string,
  nodes: ExistingNode[],
): string {
  const map = nodes
    .map((n) => `- "${n.title}" (${n.category})`)
    .join("\n");

  return `RESEARCH CONTEXT
${context.trim()}

CURRENT CANVAS MAP (${nodes.length} nodes)
${map}

Scan across this whole map and surface 2-3 non-obvious cross-cutting insights.`;
}

// JSON Schema for structured outputs (output_config.format).
// Note the structured-output limitations: additionalProperties:false on every
// object, no min/max constraints, enums are fine.
function findingItemSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      subcategory: { type: "string" },
      content: { type: "string" },
      connectsTo: { type: "array", items: { type: "string" } },
      connectionType: { type: "string", enum: [...CONNECTION_TYPES] },
      flag: { type: "string", enum: [...FLAGS] },
    },
    required: [
      "title",
      "subcategory",
      "content",
      "connectsTo",
      "connectionType",
      "flag",
    ],
    additionalProperties: false,
  };
}

export const DIVE_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    findings: { type: "array", items: findingItemSchema() },
  },
  required: ["intro", "findings"],
  additionalProperties: false,
};

export const SCAN_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    insights: { type: "array", items: findingItemSchema() },
  },
  required: ["intro", "insights"],
  additionalProperties: false,
};

// ---------- Chat ----------

function mapBlock(nodes: ExistingNode[]): string {
  return nodes.length > 0
    ? nodes.map((n) => `- "${n.title}" (${n.category})`).join("\n")
    : "(empty — nothing charted yet)";
}

export function chatSystem(context: string, nodes: ExistingNode[]): string {
  return `${PERSONA}

You're in a back-and-forth conversation with the researcher about their problem
space. Answer their questions and follow-ups directly, from a systems lens. Be
specific and suggestion-oriented — point to concrete forces, stakeholders, tensions,
feedback loops, and leverage points rather than generalities. Keep replies tight (a
few short paragraphs or a compact list), never an essay.

You don't need any special formatting for things worth keeping: the researcher can
pull any of your replies onto their canvas as nodes with one click, so just make your
points concrete enough that they convert well into standalone findings.

RESEARCH CONTEXT
${context.trim() || "(not yet set)"}

CURRENT CANVAS MAP
${mapBlock(nodes)}`;
}

// ---------- Extract (chat answer -> canvas findings) ----------

export const EXTRACT_SYSTEM = `${PERSONA}

Convert a piece of your own research answer into canvas-ready findings. Pull out the
2-5 most concrete and distinct ideas and shape each as a node.

${NODE_RULES}

Return between 2 and 5 findings. Skip vague throat-clearing — only surface ideas
specific enough to stand on their own as a node.`;

export function buildExtractUser(
  context: string,
  text: string,
  nodes: ExistingNode[],
): string {
  const existing =
    nodes.length > 0
      ? nodes.map((n) => `- "${n.title}" (${n.category})`).join("\n")
      : "(none yet)";

  return `RESEARCH CONTEXT
${context.trim()}

EXISTING CANVAS NODES (you may connect new findings to these by title)
${existing}

ANSWER TO CONVERT INTO FINDINGS
${text.trim()}`;
}

export const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    findings: { type: "array", items: findingItemSchema() },
  },
  required: ["findings"],
  additionalProperties: false,
};

// ---------- Follow-up suggestions ----------

export const FOLLOWUPS_SYSTEM = `${PERSONA}

Based on the conversation so far, suggest exactly 3 short follow-up questions the
researcher is most likely to want to ask next. Each must be specific to THIS thread
and their research — never generic. Keep each under ~12 words, phrased the way the
researcher would ask it. Return them via the schema.`;

export function buildFollowupsUser(
  context: string,
  messages: { role: string; content: string }[],
  nodes: ExistingNode[],
): string {
  const convo = messages
    .slice(-6)
    .map(
      (m) =>
        `${m.role === "assistant" ? "Anagno" : "Researcher"}: ${m.content}`,
    )
    .join("\n");
  const map =
    nodes.length > 0
      ? nodes.map((n) => `- "${n.title}"`).join("\n")
      : "(empty)";
  return `RESEARCH CONTEXT
${context.trim()}

CANVAS NODES
${map}

CONVERSATION SO FAR
${convo}

Suggest 3 follow-up questions.`;
}

export const FOLLOWUPS_SCHEMA = {
  type: "object",
  properties: {
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["suggestions"],
  additionalProperties: false,
};
