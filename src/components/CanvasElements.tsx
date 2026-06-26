import { useContext, useEffect, useState, type ReactNode } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { NodeActionsContext } from "./nodeActions";
import { unfurl, type UnfurlResult } from "../api";
import WaveLoader from "./WaveLoader";

export type ElementKind = "sticky" | "text" | "shape";

export interface ElementData {
  kind: ElementKind;
  text: string;
  color: string;
  shape?: "rect" | "ellipse" | "triangle" | "diamond";
  locked?: boolean;
  fontFamily?: "sans" | "serif" | "mono" | "marker";
  fontSize?: "S" | "M" | "L" | "XL";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right";
  textColor?: string;
  [key: string]: unknown;
}

const FONTS: Record<string, string> = {
  sans: 'var(--font-sans)',
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono)",
  marker: "'Bradley Hand', 'Comic Sans MS', 'Segoe Print', cursive",
};
const SIZES: Record<string, number> = { S: 13, M: 16, L: 22, XL: 30 };
const TEXT_COLORS = [
  "#2d2416",
  "#ffffff",
  "#c47c5a",
  "#7bbfb5",
  "#5c8a62",
  "#c2a45c",
  "#6b9bb5",
  "#9a4a2a",
];
const FILL_COLORS = [
  "#7bbfb5",
  "#a8d5cb",
  "#7a9e7e",
  "#c47c5a",
  "#c2a45c",
  "#6b9bb5",
  "#f3e2a9",
  "#d6cfc7",
];

function textStyle(d: ElementData): React.CSSProperties {
  const deco =
    [d.underline ? "underline" : "", d.strike ? "line-through" : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    fontFamily: FONTS[d.fontFamily ?? "sans"],
    fontSize: SIZES[d.fontSize ?? "M"],
    fontWeight: d.bold ? 700 : undefined,
    fontStyle: d.italic ? "italic" : undefined,
    textDecoration: deco,
    textAlign: d.align,
    color: d.textColor,
  };
}

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Top} className="el-handle" />
      <Handle type="source" position={Position.Bottom} className="el-handle" />
      <Handle type="target" position={Position.Left} className="el-handle" id="l" />
      <Handle type="source" position={Position.Right} className="el-handle" id="r" />
    </>
  );
}

function alignIcon(a: "left" | "center" | "right"): ReactNode {
  const rows: Record<string, [number, number][]> = {
    left: [
      [4, 20],
      [4, 14],
      [4, 18],
    ],
    center: [
      [4, 20],
      [7, 17],
      [5, 19],
    ],
    right: [
      [4, 20],
      [10, 20],
      [6, 20],
    ],
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {rows[a].map(([x1, x2], i) => (
        <line key={i} x1={x1} y1={6 + i * 6} x2={x2} y2={6 + i * 6} />
      ))}
    </svg>
  );
}

function Swatches({
  colors,
  current,
  onPick,
  onClear,
}: {
  colors: string[];
  current?: string;
  onPick: (c: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="el-swatches nodrag" onMouseDown={(e) => e.stopPropagation()}>
      {onClear && (
        <button className="el-swatch clear" onClick={onClear} title="Default">
          ✕
        </button>
      )}
      {colors.map((c) => (
        <button
          key={c}
          className="el-swatch"
          style={{ background: c }}
          onClick={() => onPick(c)}
        />
      ))}
      <label className="el-swatch custom" title="Custom colour">
        <input
          type="color"
          value={current ?? "#7bbfb5"}
          onChange={(e) => onPick(e.target.value)}
        />
      </label>
    </div>
  );
}

function ElementToolbar({ id, d }: { id: string; d: ElementData }) {
  const { onChange } = useContext(NodeActionsContext);
  const set = (patch: Partial<ElementData>) => onChange(id, patch);
  const [pop, setPop] = useState<null | "text" | "fill">(null);

  return (
    <div
      className="el-toolbar nodrag"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <select
        className="el-tb-select"
        value={d.fontFamily ?? "sans"}
        onChange={(e) => set({ fontFamily: e.target.value as ElementData["fontFamily"] })}
        title="Font"
      >
        <option value="sans">Sans</option>
        <option value="serif">Serif</option>
        <option value="mono">Mono</option>
        <option value="marker">Marker</option>
      </select>
      <select
        className="el-tb-select"
        value={d.fontSize ?? "M"}
        onChange={(e) => set({ fontSize: e.target.value as ElementData["fontSize"] })}
        title="Size"
      >
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
      </select>

      <span className="el-tb-sep" />
      <button className={`el-tb-btn ${d.bold ? "on" : ""}`} onClick={() => set({ bold: !d.bold })} title="Bold">
        <b>B</b>
      </button>
      <button className={`el-tb-btn ${d.italic ? "on" : ""}`} onClick={() => set({ italic: !d.italic })} title="Italic">
        <i>I</i>
      </button>
      <button className={`el-tb-btn ${d.underline ? "on" : ""}`} onClick={() => set({ underline: !d.underline })} title="Underline">
        <u>U</u>
      </button>
      <button className={`el-tb-btn ${d.strike ? "on" : ""}`} onClick={() => set({ strike: !d.strike })} title="Strikethrough">
        <s>S</s>
      </button>

      <span className="el-tb-sep" />
      {(["left", "center", "right"] as const).map((a) => (
        <button
          key={a}
          className={`el-tb-btn ${(d.align ?? "left") === a ? "on" : ""}`}
          onClick={() => set({ align: a })}
          title={`Align ${a}`}
        >
          {alignIcon(a)}
        </button>
      ))}

      {d.kind === "shape" && (
        <>
          <span className="el-tb-sep" />
          <select
            className="el-tb-select"
            value={d.shape ?? "rect"}
            onChange={(e) =>
              set({ shape: e.target.value as ElementData["shape"] })
            }
            title="Shape"
          >
            <option value="rect">Rectangle</option>
            <option value="ellipse">Ellipse</option>
            <option value="triangle">Triangle</option>
            <option value="diamond">Diamond</option>
          </select>
        </>
      )}

      <span className="el-tb-sep" />
      <div className="el-tb-color">
        <button
          className="el-tb-btn"
          onClick={() => setPop(pop === "text" ? null : "text")}
          title="Text colour"
        >
          <span
            className="el-tb-A"
            style={{ borderColor: d.textColor || "currentColor" }}
          >
            A
          </span>
        </button>
        {pop === "text" && (
          <Swatches
            colors={TEXT_COLORS}
            current={d.textColor}
            onPick={(c) => set({ textColor: c })}
            onClear={() => set({ textColor: undefined })}
          />
        )}
      </div>

      {(d.kind === "shape" || d.kind === "sticky") && (
        <div className="el-tb-color">
          <button
            className="el-tb-btn"
            onClick={() => setPop(pop === "fill" ? null : "fill")}
            title="Fill colour"
          >
            <span className="el-tb-fill" style={{ background: d.color }} />
          </button>
          {pop === "fill" && (
            <Swatches
              colors={FILL_COLORS}
              current={d.color}
              onPick={(c) => set({ color: c })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function useEditable(id: string, data: ElementData) {
  const { onChange, onBeginEdit } = useContext(NodeActionsContext);
  const [editing, setEditing] = useState(false);
  function begin() {
    if (data.locked) return;
    onBeginEdit(id);
    setEditing(true);
  }
  return { editing, begin, end: () => setEditing(false), onChange };
}

export function StickyNode({ id, data, selected }: NodeProps) {
  const d = data as ElementData;
  const { editing, begin, end, onChange } = useEditable(id, d);
  const show = Boolean(selected) && !d.locked;
  return (
    <div
      className={`el sticky ${selected ? "el-sel" : ""} ${d.locked ? "el-locked" : ""}`}
      style={{ background: d.color }}
      onDoubleClick={begin}
    >
      <NodeResizer isVisible={show} minWidth={120} minHeight={90} />
      <Handles />
      {show && <ElementToolbar id={id} d={d} />}
      {editing ? (
        <textarea
          className="el-edit nodrag"
          autoFocus
          style={textStyle(d)}
          value={d.text}
          onChange={(e) => onChange(id, { text: e.target.value })}
          onBlur={end}
        />
      ) : (
        <div className="el-text" style={textStyle(d)}>
          {d.text || "Double-click to write"}
        </div>
      )}
      {d.locked && <span className="el-lock">🔒</span>}
    </div>
  );
}

export function TextNode({ id, data, selected }: NodeProps) {
  const d = data as ElementData;
  const { editing, begin, end, onChange } = useEditable(id, d);
  const show = Boolean(selected) && !d.locked;
  return (
    <div className={`el text ${selected ? "el-sel" : ""}`} onDoubleClick={begin}>
      <NodeResizer isVisible={show} minWidth={80} minHeight={28} />
      <Handles />
      {show && <ElementToolbar id={id} d={d} />}
      {editing ? (
        <textarea
          className="el-edit nodrag transparent"
          autoFocus
          style={textStyle(d)}
          value={d.text}
          onChange={(e) => onChange(id, { text: e.target.value })}
          onBlur={end}
        />
      ) : (
        <div className="el-text" style={textStyle(d)}>
          {d.text || "Text"}
        </div>
      )}
      {d.locked && <span className="el-lock">🔒</span>}
    </div>
  );
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const d = data as ElementData;
  const { editing, begin, end, onChange } = useEditable(id, d);
  const show = Boolean(selected) && !d.locked;
  return (
    <div
      className={`el shape ${d.shape ?? "rect"} ${selected ? "el-sel" : ""}`}
      style={{ "--fill": d.color } as React.CSSProperties}
      onDoubleClick={begin}
    >
      <NodeResizer isVisible={show} minWidth={80} minHeight={60} />
      <Handles />
      {show && <ElementToolbar id={id} d={d} />}
      {editing ? (
        <textarea
          className="el-edit nodrag transparent center"
          autoFocus
          style={textStyle(d)}
          value={d.text}
          onChange={(e) => onChange(id, { text: e.target.value })}
          onBlur={end}
        />
      ) : (
        <div className="el-text center" style={textStyle(d)}>
          {d.text}
        </div>
      )}
      {d.locked && <span className="el-lock">🔒</span>}
    </div>
  );
}

export interface LinkData {
  url: string;
  locked?: boolean;
  [key: string]: unknown;
}

export function LinkNode({ data, selected }: NodeProps) {
  const d = data as LinkData;
  const [meta, setMeta] = useState<UnfurlResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    unfurl(d.url)
      .then((m) => live && setMeta(m))
      .catch(() => live && setMeta({ kind: "link", url: d.url, title: d.url }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [d.url]);

  const show = Boolean(selected) && !d.locked;
  const host = (() => {
    try {
      return new URL(d.url).hostname.replace(/^www\./, "");
    } catch {
      return d.url;
    }
  })();

  return (
    <div className={`el link ${selected ? "el-sel" : ""}`}>
      <NodeResizer isVisible={show} minWidth={220} minHeight={130} />
      <Handles />
      <div className="link-bar">
        <span className="link-site">{meta?.site || host}</span>
        <a
          className="link-open nodrag"
          href={d.url}
          target="_blank"
          rel="noreferrer"
          title="Open in new tab"
          onMouseDown={(e) => e.stopPropagation()}
        >
          ↗
        </a>
      </div>
      <div className="link-content">
        {loading ? (
          <div className="link-loading">
            <WaveLoader /> Surfacing link…
          </div>
        ) : meta?.kind === "video" && meta.embed ? (
          <iframe
            className="link-embed"
            src={meta.embed}
            title={meta.title || "video"}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className="link-card"
            onClick={() => window.open(d.url, "_blank", "noopener")}
          >
            {meta?.image ? (
              <span
                className="link-thumb"
                style={{ backgroundImage: `url("${meta.image}")` }}
              />
            ) : (
              <span className="link-thumb placeholder" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 15l6-6" />
                  <path d="M11 7l1-1a4 4 0 015.7 5.7l-2 2" />
                  <path d="M13 17l-1 1a4 4 0 01-5.7-5.7l2-2" />
                </svg>
              </span>
            )}
            <span className="link-textmeta">
              <span className="link-title">{meta?.title || d.url}</span>
              {meta?.description && (
                <span className="link-desc">{meta.description}</span>
              )}
            </span>
          </div>
        )}
      </div>
      {d.locked && <span className="el-lock">🔒</span>}
    </div>
  );
}
