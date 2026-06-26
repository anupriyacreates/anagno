import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionLineType,
  ConnectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnReconnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import DiverNode from "./DiverNode";
import { StickyNode, TextNode, ShapeNode, LinkNode } from "./CanvasElements";
import FloatingEdge from "./FloatingEdge";
import { NodeActionsContext, type NodeActions } from "./nodeActions";
import { EdgeActionsContext, type EdgeActions } from "./edgeActions";
import CanvasToolbar, { type Tool, type AddKind } from "./CanvasToolbar";

const nodeTypes = {
  diver: DiverNode,
  sticky: StickyNode,
  text: TextNode,
  shape: ShapeNode,
  link: LinkNode,
};
const edgeTypes = { floating: FloatingEdge };

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onReconnect: OnReconnect<Edge>;
  actions: NodeActions;
  edgeActions: EdgeActions;
  empty: boolean;
  rippleKey: number;
  tool: Tool;
  onTool: (t: Tool) => void;
  onInit: (rf: ReactFlowInstance) => void;
  onNodeContextMenu: (e: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onDragStart: () => void;
  onAddElement: (kind: AddKind) => void;
  onAddLink: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Board({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  actions,
  edgeActions,
  empty,
  rippleKey,
  tool,
  onTool,
  onInit,
  onNodeContextMenu,
  onPaneClick,
  onDragStart,
  onAddElement,
  onAddLink,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const ctx = useMemo(() => actions, [actions]);

  return (
    <div className={`shore tool-${tool}`}>
      <EdgeActionsContext.Provider value={edgeActions}>
      <NodeActionsContext.Provider value={ctx}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onInit={onInit}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onNodeDragStart={onDragStart}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionRadius={30}
          nodesDraggable={tool === "select"}
          panOnDrag={tool === "hand" ? [0, 1, 2] : [1, 2]}
          panOnScroll
          selectionOnDrag={tool === "select"}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={2}
            color="var(--dot)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </NodeActionsContext.Provider>
      </EdgeActionsContext.Provider>

      {rippleKey > 0 && <div key={rippleKey} className="shore-ripple" />}

      {empty && (
        <div className="shore-empty">
          <div className="shore-empty-sun" />
          <h2>The shore is clear</h2>
          <p>
            Load a lens into the Diver and press <strong>Dive&nbsp;↓</strong>, or
            drop a sticky, text, or shape from the toolbar below.
          </p>
        </div>
      )}

      <CanvasToolbar
        tool={tool}
        onTool={onTool}
        onAdd={onAddElement}
        onAddLink={onAddLink}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
