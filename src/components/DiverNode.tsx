import { useContext, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConnectionType, Flag } from "../types";
import { NodeActionsContext } from "./nodeActions";

export interface DiverNodeData {
  title: string;
  category: string;
  content: string;
  color: string;
  flag: Flag;
  frameworkId: string;
  connectsTo: string[];
  connectionType: ConnectionType;
  isInsight?: boolean;
  rotation?: number;
  appearDelay?: number;
  locked?: boolean;
  [key: string]: unknown;
}

function flagTag(flag: Flag, isInsight?: boolean) {
  if (flag === "big_deal")
    return (
      <span className="node-tag tag-leverage">
        {isInsight ? "emerging insight" : "leverage"}
      </span>
    );
  if (flag === "contradiction")
    return (
      <span className="node-tag tag-tension">
        {isInsight ? "doesn't add up" : "tension"}
      </span>
    );
  return null;
}

export default function DiverNode({ id, data, selected }: NodeProps) {
  const d = data as DiverNodeData;
  const { onChange, onDelete, onBeginEdit } = useContext(NodeActionsContext);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(d.title);
  const [content, setContent] = useState(d.content);

  function startEdit() {
    if (d.locked) return;
    onBeginEdit(id);
    setEditing(true);
  }
  function save() {
    onChange(id, { title: title.trim(), content: content.trim() });
    setEditing(false);
  }

  return (
    <div
      className="xnode-wrap"
      style={{ animationDelay: `${d.appearDelay ?? 0}s` } as React.CSSProperties}
    >
      <div
        className={`xnode ${d.isInsight ? "xnode-insight" : ""} ${
          d.flag === "big_deal" ? "xnode-emerging" : ""
        } ${d.flag === "contradiction" ? "xnode-contra" : ""} ${
          selected ? "xnode-sel" : ""
        }`}
        style={
          {
            "--accent": d.color,
            "--rot": `${d.rotation ?? 0}deg`,
          } as React.CSSProperties
        }
        onDoubleClick={startEdit}
      >
        <Handle type="target" position={Position.Top} />
        <div className="xnode-top">
          <span className="xnode-cat">{d.category}</span>
          <div className="xnode-top-right">
            {flagTag(d.flag, d.isInsight)}
            {d.locked && <span className="el-lock inline">🔒</span>}
            <button
              className="xnode-del nodrag"
              onClick={() => onDelete(id)}
              aria-label="Delete node"
            >
              ×
            </button>
          </div>
        </div>

        {editing ? (
          <>
            <input
              className="xnode-title-edit nodrag"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="xnode-content-edit nodrag"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <div className="xnode-edit-actions">
              <button className="mini-btn solid nodrag" onClick={save}>
                Save
              </button>
              <button
                className="mini-btn nodrag"
                onClick={() => {
                  setTitle(d.title);
                  setContent(d.content);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="xnode-title">{d.title}</div>
            <div className="xnode-content">{d.content}</div>
          </>
        )}

        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
}
