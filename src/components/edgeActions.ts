import { createContext, useContext } from "react";

export interface EdgeActions {
  onLabelChange: (id: string, label: string) => void;
}

export const EdgeActionsContext = createContext<EdgeActions>({
  onLabelChange: () => {},
});

export const useEdgeActions = () => useContext(EdgeActionsContext);
