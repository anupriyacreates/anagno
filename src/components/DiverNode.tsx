import { useContext, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConnectionType, Flag, NodeKind, Level, Stance } from "../types";
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
  // systems-model fields
  kind?: NodeKind; // default "finding"
  power?: Level; // actor only
  interest?: Level; // actor only
  stance?: Stance; // actor only
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
  const kind = d.kind ?? "finding";
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(d.title);
  const [content, setContent] = useState(d.content);
  const [power, setPower] = useState<Level>(d.power ?? "med");
  const [interest, setInterest] = useState<Level>(d.interest ?? "med");
  const [stance, setStance] = useState<Stance>(d.stance ?? "neutral");

  function startEdit() {
    if (d.locked) return;
    onBeginEdit(id);
    setEditing(true);
  }
  function save() {
    const patch: Partial<DiverNodeData> = {
      title: title.trim(),
      content: content.trim(),
    };
    if (kind === "actor") {
      patch.power = power;
      patch.interest = interest;
      patch.stance = stance;
    }
    onChange(id, patch);
    setEditing(false);
  }

  return (
    <div
      className="xnode-wrap"
      style={{ animationDelay: `${d.appearDelay ?? 0}s` } as React.CSSProperties}
    >
      <div
        className={`xnode xnode-${kind} ${d.isInsight ? "xnode-insight" : ""} ${
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
          <span className="xnode-cat">
            {kind !== "finding" && (
              <span className={`node-kind kind-${kind}`}>{kind}</span>
            )}
            {d.category}
          </span>
          <div className="xnode-top-right">
            {flagTag(d.flag, d.isInsight)}
            {d.locked && (
              <span className="el-lock inline" aria-label="Locked" title="Locked">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 018 0v3" />
                </svg>
              </span>
            )}
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
            {kind === "actor" && (
              <div className="actor-edit nodrag">
                <label>
                  Power
                  <select value={power} onChange={(e) => setPower(e.target.value as Level)}>
                    <option value="low">low</option>
                    <option value="med">med</option>
                    <option value="high">high</option>
                  </select>
                </label>
                <label>
                  Interest
                  <select value={interest} onChange={(e) => setInterest(e.target.value as Level)}>
                    <option value="low">low</option>
                    <option value="med">med</option>
                    <option value="high">high</option>
                  </select>
                </label>
                <label>
                  Stance
                  <select value={stance} onChange={(e) => setStance(e.target.value as Stance)}>
                    <option value="ally">ally</option>
                    <option value="neutral">neutral</option>
                    <option value="blocker">blocker</option>
                    <option value="mixed">mixed</option>
                  </select>
                </label>
              </div>
            )}
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
            {d.content && <div className="xnode-content">{d.content}</div>}
            {kind === "actor" && (
              <div className="actor-chips">
                <span className="actor-chip">power: {d.power ?? "med"}</span>
                <span className="actor-chip">interest: {d.interest ?? "med"}</span>
                <span className={`actor-chip stance-${d.stance ?? "neutral"}`}>
                  {d.stance ?? "neutral"}
                </span>
              </div>
            )}
          </>
        )}

        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
}
