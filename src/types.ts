export type ConnectionType =
  | "causes"
  | "contradicts"
  | "supports"
  | "amplifies"
  | "feeds into";

export type Flag = "none" | "big_deal" | "contradiction";

/** Systems-model node kinds. "finding" is the original research node. */
export type NodeKind = "finding" | "actor" | "factor";
export type Level = "low" | "med" | "high";
export type Stance = "ally" | "blocker" | "neutral" | "mixed";

/** Signed causal polarity on a link: + moves together, − moves opposite. */
export type Sign = "+" | "-";

/** A feedback loop detected in the signed causal graph. */
export interface Loop {
  id: string;
  members: string[]; // node ids in cycle order
  type: "R" | "B"; // reinforcing | balancing
  label: string;
  negatives: number; // count of − links (even ⇒ R, odd ⇒ B)
}

/** A ranked leverage candidate. */
export interface LeveragePoint {
  nodeId: string;
  title: string;
  score: number;
  reason: string;
}

export interface FrameworkDef {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  category: string;
  popular?: boolean;
  custom?: boolean;
}

/** A raw finding as returned by the API. */
export interface RawFinding {
  title: string;
  subcategory: string;
  content: string;
  connectsTo: string[];
  connectionType: ConnectionType;
  flag: Flag;
}

export interface DiveResponse {
  intro: string;
  findings: RawFinding[];
}

export interface ScanResponse {
  intro: string;
  insights: RawFinding[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  starred?: boolean;
  pinned?: boolean;
}

/** A surfaced finding waiting in the tray to be added to the canvas. */
export interface PendingFinding {
  id: string;
  frameworkId: string;
  frameworkName: string;
  frameworkColor: string;
  finding: RawFinding;
}
