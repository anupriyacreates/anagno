export type ConnectionType =
  | "causes"
  | "contradicts"
  | "supports"
  | "amplifies"
  | "feeds into";

export type Flag = "none" | "big_deal" | "contradiction";

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
