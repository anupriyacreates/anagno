import { useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { getEdgeParams } from "./floatingEdgeUtils";
import { useEdgeActions } from "./edgeActions";

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  selected,
}: EdgeProps) {
  const { onLabelChange } = useEdgeActions();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(typeof label === "string" ? label : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(typeof label === "string" ? label : "");
  }, [label]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );
  const [path, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  const text = typeof label === "string" ? label : "";
  const commit = () => {
    onLabelChange(id, draft.trim());
    setEditing(false);
  };

  // show the pill when there's a label, while editing, or when the edge is selected
  const showPill = editing || !!text || selected;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {showPill && (
        <EdgeLabelRenderer>
          <div
            className="floating-edge-label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {editing ? (
              <input
                ref={inputRef}
                className="edge-label-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(text);
                    setEditing(false);
                  }
                }}
              />
            ) : (
              <button
                className={`edge-label-text ${text ? "" : "empty"}`}
                onDoubleClick={() => setEditing(true)}
                title="Double-click to edit the connection"
              >
                {text || "label"}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
