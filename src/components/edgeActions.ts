import { createContext, useContext } from "react";
import type { Sign } from "../types";

export interface EdgeActions {
  onLabelChange: (id: string, label: string) => void;
  onSetSign: (id: string, sign: Sign) => void;
}

export const EdgeActionsContext = createContext<EdgeActions>({
  onLabelChange: () => {},
  onSetSign: () => {},
});

export const useEdgeActions = () => useContext(EdgeActionsContext);
