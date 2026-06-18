import type { FrameworkDef } from "../types";

// Built-in lenses, grouped by category. `popular` lenses surface as quick-access
// chips in the Diver; the rest live in the Framework Library overlay.
// `description` doubles as model guidance during a dive.
export const BUILT_IN_FRAMEWORKS: FrameworkDef[] = [
  // Environment & forces
  {
    id: "pestel",
    name: "PESTEL",
    icon: "🌍",
    color: "#7bbfb5",
    category: "Environment & forces",
    popular: true,
    description:
      "Macro-environment scan across Political, Economic, Social, Technological, Environmental, and Legal forces shaping the problem space.",
  },
  {
    id: "swot",
    name: "SWOT",
    icon: "⚖️",
    color: "#6b9bb5",
    category: "Environment & forces",
    description:
      "Strengths, Weaknesses, Opportunities, and Threats relevant to the problem space and the actors within it.",
  },
  {
    id: "five-forces",
    name: "Five Forces",
    icon: "♟️",
    color: "#6b9bb5",
    category: "Environment & forces",
    description:
      "Porter's Five Forces — competitive rivalry, supplier and buyer power, threat of substitutes, and new entrants.",
  },
  // People & stakeholders
  {
    id: "stakeholder-map",
    name: "Stakeholder",
    icon: "👥",
    color: "#c47c5a",
    category: "People & stakeholders",
    popular: true,
    description:
      "The people and groups with a stake in the problem — primary, secondary, and hidden stakeholders — their interests, influence, and tensions.",
  },
  {
    id: "jtbd",
    name: "Jobs To Be Done",
    icon: "🎯",
    color: "#c2a45c",
    category: "People & stakeholders",
    popular: true,
    description:
      "The functional, emotional, and social jobs users are trying to get done, the progress they seek, and the obstacles in their way.",
  },
  {
    id: "empathy-map",
    name: "Empathy Map",
    icon: "💭",
    color: "#c47c5a",
    category: "People & stakeholders",
    description:
      "What key users say, think, do, and feel — plus their pains and gains around the problem.",
  },
  // Systems & causality
  {
    id: "causal-loop",
    name: "Causal Loop",
    icon: "🔁",
    color: "#7a9e7e",
    category: "Systems & causality",
    popular: true,
    description:
      "Reinforcing and balancing feedback loops — what amplifies or dampens behaviour over time, and where vicious or virtuous cycles form.",
  },
  {
    id: "system-boundaries",
    name: "System Boundaries",
    icon: "🧭",
    color: "#5c8a62",
    category: "Systems & causality",
    description:
      "What is inside vs outside the system under study — boundary choices, what's in scope, what's externalized, and where leverage lives.",
  },
  {
    id: "leverage-points",
    name: "Leverage Points",
    icon: "🪝",
    color: "#5c8a62",
    category: "Systems & causality",
    description:
      "Meadows' leverage points — where a small shift could produce big change in the system (rules, goals, information flows, paradigms).",
  },
  // Problem & root cause
  {
    id: "five-whys",
    name: "5 Whys",
    icon: "❓",
    color: "#b0876a",
    category: "Problem & root cause",
    description:
      "Root-cause chains — repeatedly asking why a problem occurs to trace surface symptoms down to underlying causes.",
  },
  {
    id: "problem-tree",
    name: "Problem Tree",
    icon: "🌳",
    color: "#b0876a",
    category: "Problem & root cause",
    description:
      "Core problem in the trunk, its root causes below, and its effects/consequences branching above.",
  },
  // Value & flow
  {
    id: "value-chain",
    name: "Value Chain",
    icon: "🔗",
    color: "#7bbfb5",
    category: "Value & flow",
    description:
      "The activities that create value end to end, and where value is added, lost, or bottlenecked.",
  },
  {
    id: "service-blueprint",
    name: "Service Blueprint",
    icon: "🗺️",
    color: "#7bbfb5",
    category: "Value & flow",
    description:
      "Front-stage actions, back-stage processes, and supporting systems across a service journey, plus their failure points.",
  },
];

const CUSTOM_COLORS = ["#c47c5a", "#7bbfb5", "#7a9e7e", "#c2a45c", "#6b9bb5"];

export function makeCustomFramework(name: string, index: number): FrameworkDef {
  return {
    id: `custom-${Date.now()}-${index}`,
    name: name.trim(),
    icon: "🔍",
    color: CUSTOM_COLORS[index % CUSTOM_COLORS.length],
    category: "Custom",
    popular: true, // custom lenses you just made stay handy as quick chips
    custom: true,
    description: `A custom lens the researcher defined: "${name.trim()}". Populate it with findings that fit what this lens would surface for the research context.`,
  };
}
