import { createContext } from "react";

export interface NodeActions {
  onChange: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  /** Called when a node begins an edit, so history can snapshot pre-edit state. */
  onBeginEdit: (id: string) => void;
}

export const NodeActionsContext = createContext<NodeActions>({
  onChange: () => {},
  onDelete: () => {},
  onBeginEdit: () => {},
});
