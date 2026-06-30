// Canned content for showcase / demo mode — all written around the single demo
// project (see demoProject.ts): why value-conscious buyers hesitate on
// modular/prefab homes. Everything reads like the real Anthropic-backed
// responses (same shapes, same Diver voice) so a viewer can exercise every
// feature with no backend or API key.
//
// Findings are shaped per `RawFinding` in ../types. Intra-batch `connectsTo`
// references use sibling titles in the same batch so edges render on the canvas.

import type { FrameworkDef, RawFinding } from "../types";

interface DiveFixture {
  intro: string;
  findings: RawFinding[];
}

// ---------------------------------------------------------------- dives by lens
export const DIVE_FIXTURES: Record<string, DiveFixture> = {
  pestel: {
    intro:
      "Surfaced the macro-forces around prefab adoption — and a few of them quietly hold demand down.",
    findings: [
      {
        title: "Loan products lag prefab",
        subcategory: "Economic",
        content:
          "Most home loans are written for on-site construction, so modular buyers face awkward disbursement schedules and lower sanctioned amounts. The financing friction reads as 'risky' to buyers.",
        connectsTo: [],
        connectionType: "causes",
        flag: "big_deal",
      },
      {
        title: "Resale market is thin",
        subcategory: "Economic",
        content:
          "Few comparable prefab resales means appraisers and buyers can't price them confidently, so owners fear losing value — even when build quality is high.",
        connectsTo: ["Loan products lag prefab"],
        connectionType: "amplifies",
        flag: "none",
      },
      {
        title: "'Real home' is a cultural default",
        subcategory: "Social",
        content:
          "Brick-and-mortar signals permanence and status. Prefab fights an inherited assumption that it's temporary or lesser, regardless of the spec sheet.",
        connectsTo: [],
        connectionType: "causes",
        flag: "big_deal",
      },
      {
        title: "Permits assume on-site builds",
        subcategory: "Legal",
        content:
          "Local approval processes and inspectors are written around conventional construction, adding delay and uncertainty to modular projects.",
        connectsTo: ["Resale market is thin"],
        connectionType: "feeds into",
        flag: "none",
      },
    ],
  },

  "stakeholder-map": {
    intro:
      "Mapped who actually shapes a prefab 'yes' — and the lender may matter more than the buyer.",
    findings: [
      {
        title: "The lender is the real gatekeeper",
        subcategory: "Primary stakeholder",
        content:
          "Approval and loan terms can make or break the purchase. If the bank hesitates on modular, the buyer's enthusiasm doesn't carry the deal.",
        connectsTo: [],
        connectionType: "causes",
        flag: "big_deal",
      },
      {
        title: "The family vetoes on feel",
        subcategory: "Hidden stakeholder",
        content:
          "Parents and spouses weigh in heavily on a first home. Their 'will it feel real' reaction can quietly kill a deal the buyer wanted.",
        connectsTo: ["The lender is the real gatekeeper"],
        connectionType: "feeds into",
        flag: "none",
      },
      {
        title: "The builder sells trust, not units",
        subcategory: "Secondary stakeholder",
        content:
          "Buyers are really buying confidence the home will be delivered and stand up over time. The builder's track record is the product as much as the house.",
        connectsTo: ["The lender is the real gatekeeper"],
        connectionType: "supports",
        flag: "none",
      },
      {
        title: "Regulators set the clock",
        subcategory: "Hidden stakeholder",
        content:
          "Local permit officers control timelines and can add uncertainty that compounds the buyer's other worries.",
        connectsTo: [],
        connectionType: "causes",
        flag: "none",
      },
    ],
  },

  jtbd: {
    intro:
      "Here's the progress a prefab buyer is really after — saving money is only the surface job.",
    findings: [
      {
        title: "Hiring a home to feel secure",
        subcategory: "Emotional job",
        content:
          "Beyond cost and speed, buyers want to stop worrying — about resale, loans, and whether they chose wrong. Reassurance is the real purchase.",
        connectsTo: [],
        connectionType: "causes",
        flag: "big_deal",
      },
      {
        title: "A home that earns family approval",
        subcategory: "Social job",
        content:
          "First-home buyers need the choice to look smart and legitimate to parents and peers, not like a risky shortcut.",
        connectsTo: [],
        connectionType: "causes",
        flag: "none",
      },
      {
        title: "Move in without surprises",
        subcategory: "Functional job",
        content:
          "The concrete job is a finished, livable home on a predictable date and budget. Fewer unknowns beats more features.",
        connectsTo: ["Hiring a home to feel secure"],
        connectionType: "supports",
        flag: "none",
      },
      {
        title: "Escape the rent trap now",
        subcategory: "Progress sought",
        content:
          "The push is urgency — rising rent and the wish to own soon. Modular's speed is a strong pull once the risk fears are answered.",
        connectsTo: ["Move in without surprises"],
        connectionType: "amplifies",
        flag: "none",
      },
    ],
  },

  "causal-loop": {
    intro:
      "Found the loop keeping prefab adoption low — it's mostly self-reinforcing.",
    findings: [
      {
        title: "Few sales keep resale thin",
        subcategory: "Reinforcing loop",
        content:
          "Low adoption means few resales, which keeps pricing data thin, which keeps resale fear high, which keeps adoption low. A textbook vicious cycle.",
        connectsTo: [],
        connectionType: "feeds into",
        flag: "big_deal",
      },
      {
        title: "Lender caution feeds buyer doubt",
        subcategory: "Reinforcing loop",
        content:
          "Banks treat modular as risky, so terms are worse, so fewer buyers proceed, so banks see too little volume to justify better products.",
        connectsTo: ["Few sales keep resale thin"],
        connectionType: "amplifies",
        flag: "none",
      },
      {
        title: "Visible homes build belief",
        subcategory: "Reinforcing loop",
        content:
          "Each delivered, lived-in home nearby converts skeptics; word of mouth slowly flips the 'real home' doubt. The virtuous loop exists, but it starts slow.",
        connectsTo: ["Few sales keep resale thin"],
        connectionType: "contradicts",
        flag: "contradiction",
      },
      {
        title: "Permit delays erode momentum",
        subcategory: "Balancing loop",
        content:
          "Approval delays cool a buyer's enthusiasm and let doubts creep back in, dragging the decision back toward 'wait.'",
        connectsTo: [],
        connectionType: "feeds into",
        flag: "none",
      },
    ],
  },
};

// Generic dive for any lens without a bespoke fixture (SWOT, Five Forces,
// Empathy Map, Leverage Points, custom lenses, …) — still anchored to the topic.
export function genericDive(framework: FrameworkDef): DiveFixture {
  const sub = framework.name;
  return {
    intro: `Ran the ${framework.name} lens over the prefab-adoption question — here's where the real constraint sits.`,
    findings: [
      {
        title: "The hesitation isn't about price",
        subcategory: sub,
        content:
          "Buyers say cost, but the research points to confidence — resale, loans, and 'realness' — as the actual blocker. Cheaper alone won't move them.",
        connectsTo: [],
        connectionType: "causes",
        flag: "big_deal",
      },
      {
        title: "One worry gates the rest",
        subcategory: sub,
        content:
          "Resale fear sits upstream of the other doubts. Ease it and the loan and 'realness' concerns shrink along with it.",
        connectsTo: ["The hesitation isn't about price"],
        connectionType: "feeds into",
        flag: "none",
      },
      {
        title: "Proof beats persuasion",
        subcategory: sub,
        content:
          "A nearby, lived-in home does more than any brochure. Tangible evidence is the lever here, not better messaging.",
        connectsTo: [],
        connectionType: "causes",
        flag: "none",
      },
    ],
  };
}

// ---------------------------------------------------------------- pattern scan
export const SCAN_FIXTURE: { intro: string; insights: RawFinding[] } = {
  intro:
    "Stepping back from the whole map, the resale and lending fears reinforce each other — and one tension stands out.",
  insights: [
    {
      title: "Resale fear and lender caution form a loop",
      subcategory: "Emerging insight",
      content:
        "Thin resale data makes lenders cautious, which limits buyers, which keeps resale data thin. Two of your nodes are quietly driving each other.",
      connectsTo: [],
      connectionType: "feeds into",
      flag: "big_deal",
    },
    {
      title: "Speed pitch clashes with permit reality",
      subcategory: "Tension",
      content:
        "You sell 'faster to move in,' but permit delays can erase that advantage. The promise and the process contradict each other.",
      connectsTo: [],
      connectionType: "contradicts",
      flag: "contradiction",
    },
    {
      title: "A nearby finished home is the leverage point",
      subcategory: "Leverage point",
      content:
        "Almost every doubt — resale, realness, lender confidence — eases when a real, occupied home is visible. Small input, system-wide effect.",
      connectsTo: [],
      connectionType: "amplifies",
      flag: "big_deal",
    },
  ],
};

// ---------------------------------------------------------------- extract (chat → nodes)
export const EXTRACT_FINDINGS: RawFinding[] = [
  {
    title: "Lender confidence is the hinge",
    subcategory: "From your answer",
    content:
      "If banks treated modular like conventional builds, much of the buyer's hesitation would ease downstream.",
    connectsTo: [],
    connectionType: "causes",
    flag: "big_deal",
  },
  {
    title: "Resale fear is the root worry",
    subcategory: "From your answer",
    content:
      "It sits upstream of the other doubts and quietly caps how willing a buyer is to commit.",
    connectsTo: ["Lender confidence is the hinge"],
    connectionType: "feeds into",
    flag: "none",
  },
  {
    title: "Show, don't tell",
    subcategory: "From your answer",
    content:
      "A visitable, lived-in home converts skeptics better than any spec sheet or discount.",
    connectsTo: [],
    connectionType: "causes",
    flag: "none",
  },
];

// ---------------------------------------------------------------- follow-ups
export const FOLLOWUP_POOL: string[] = [
  "Which lender objection blocks the most deals?",
  "What would make resale value feel safe?",
  "Where does the family's veto come from?",
  "What's the fastest way to show a real home?",
  "Which permit step adds the most delay?",
  "What unlocks the virtuous adoption loop?",
];

// ---------------------------------------------------------------- chat replies
const CHAT_DEFAULT = `Good question — let me look at prefab adoption as a system, not a checklist.

The hesitation usually isn't really about price. It's confidence: will it hold resale value, will the bank back it, and will it feel like a "real home" to the buyer and their family. Those three doubts reinforce each other.

The most reinforcing loop is resale — few prefab sales means thin resale data, which keeps both buyers and lenders cautious, which keeps sales low. If I had to point at leverage, it's making a finished, lived-in home easy to visit: tangible proof eases almost every doubt at once. Want me to dive a specific lens on this?`;

const CHAT_VARIANTS: { match: RegExp; reply: string }[] = [
  {
    match: /lender|bank|loan|financ|stakeholder|family|builder|who|buyer/i,
    reply: `Worth separating who decides from who's affected — for prefab it's often the lender, not the buyer.

The bank can make or break the purchase with its terms; an enthusiastic buyer can't override a cautious loan officer. Behind them, the family weighs in on "will it feel real," and the builder is really selling trust that the home gets delivered and lasts.

Map those four — lender, family, builder, permit office — and you'll see where deals actually stall. Want me to run the Stakeholder lens and drop them on the canvas?`,
  },
  {
    match: /loop|feedback|resale|cycle|reinforc|vicious|spiral/i,
    reply: `This is mostly a reinforcing loop, not a one-off objection.

Few prefab homes sell, so there's little resale data, so buyers and appraisers can't price them confidently, so the resale fear stays high — which keeps sales low. Lender caution rides the same loop: low volume gives banks no reason to build better modular loan products.

The quiet good news is a virtuous loop hiding inside it: each delivered, lived-in home converts nearby skeptics. Want me to dive the Causal Loop lens to lay the cycles out?`,
  },
  {
    match: /why|cause|root|reason|hesitat|price|cost|expensive/i,
    reply: `Let's trace the hesitation down a level — it's rarely really about price.

Buyers say "too risky" or "too expensive," but the research points to confidence: resale value, loan approval, and whether it feels like a permanent home. Resale fear tends to sit furthest upstream — ease it and the others shrink.

So the leverage is upstream of cost: prove the home holds its value and the price objection often softens on its own. Want me to keep a couple of these as nodes?`,
  },
  {
    match: /risk|permit|delay|regulat|fail|block|wrong|threat/i,
    reply: `Good instinct to pressure-test what actually kills prefab deals.

The usual quiet killers: a lender who won't write a clean modular loan, permit delays that erase the "faster to move in" promise, and resale fear with no comparable sales to anchor it. Any one of those stalls an otherwise willing buyer.

Name them as nodes and you can watch how they reinforce each other. Want me to surface the top risks as findings?`,
  },
];

export function chatReplyFor(userText: string): string {
  for (const v of CHAT_VARIANTS) if (v.match.test(userText)) return v.reply;
  return CHAT_DEFAULT;
}

// ---------------------------------------------------------------- link unfurl
import type { UnfurlResult } from "../api";

export function makeUnfurl(url: string): UnfurlResult {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* not a full URL — keep as-is */
  }
  const yt = url.match(/(?:youtu\.be\/|[?&]v=)([\w-]{6,})/);
  if (yt) {
    return {
      kind: "video",
      url,
      title: "Reference video",
      site: "YouTube",
      description: "A saved video reference for this research.",
      embed: `https://www.youtube.com/embed/${yt[1]}`,
    };
  }
  const name = host.split(".")[0] || "Link";
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    kind: "link",
    url,
    title: `${title} — saved reference`,
    description:
      "A reference dropped onto the canvas. (Link previews are simulated in showcase mode.)",
    site: host,
  };
}
