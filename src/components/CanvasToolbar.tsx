import { useEffect, useRef, useState } from "react";

export type Tool = "select" | "hand";
export type AddKind =
  | "text"
  | "sticky"
  | "finding"
  | "actor"
  | "factor"
  | "shape-rect"
  | "shape-ellipse"
  | "shape-triangle"
  | "shape-diamond";

const NODE_KINDS: { kind: AddKind; label: string; path: React.ReactNode }[] = [
  {
    kind: "finding",
    label: "Insight",
    path: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M7 6v12" />
      </>
    ),
  },
  {
    kind: "actor",
    label: "Actor",
    path: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
      </>
    ),
  },
  {
    kind: "factor",
    label: "Factor",
    path: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 13.5l2.5-3 2 2 2.5-3" />
      </>
    ),
  },
];

interface Props {
  tool: Tool;
  onTool: (t: Tool) => void;
  onAdd: (kind: AddKind) => void;
  onAddLink: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SHAPES: { kind: AddKind; label: string; path: React.ReactNode }[] = [
  { kind: "shape-rect", label: "Rectangle", path: <rect x="4" y="6" width="16" height="12" rx="2" /> },
  { kind: "shape-ellipse", label: "Ellipse", path: <circle cx="12" cy="12" r="8" /> },
  { kind: "shape-triangle", label: "Triangle", path: <path d="M12 4 20 19 4 19Z" /> },
  { kind: "shape-diamond", label: "Diamond", path: <path d="M12 3 21 12 12 21 3 12Z" /> },
];

function I({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function CanvasToolbar({
  tool,
  onTool,
  onAdd,
  onAddLink,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const [shapeOpen, setShapeOpen] = useState(false);
  const shapeRef = useRef<HTMLDivElement>(null);
  const [nodeOpen, setNodeOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shapeOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!shapeRef.current?.contains(e.target as Node)) setShapeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShapeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [shapeOpen]);

  useEffect(() => {
    if (!nodeOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!nodeRef.current?.contains(e.target as Node)) setNodeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNodeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [nodeOpen]);

  return (
    <div className="canvas-toolbar">
      <button
        className={`tool ${tool === "select" ? "on" : ""}`}
        onClick={() => onTool("select")}
        title="Select / move"
        aria-label="Select / move"
        aria-pressed={tool === "select"}
      >
        <I>
          <path d="M5 3l7 17 2.5-7L21 10 5 3z" />
        </I>
      </button>
      <button
        className={`tool ${tool === "hand" ? "on" : ""}`}
        onClick={() => onTool("hand")}
        title="Hand / pan"
        aria-label="Hand / pan"
        aria-pressed={tool === "hand"}
      >
        <I>
          <path d="M18 11V6a2 2 0 0 0-4 0" />
          <path d="M14 10V4a2 2 0 0 0-4 0v2" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </I>
      </button>

      <span className="tool-sep" />

      <button
        className="tool"
        onClick={() => onAdd("text")}
        title="Text"
        aria-label="Add text"
      >
        <span className="tool-letter">T</span>
      </button>
      <button
        className="tool"
        onClick={() => onAdd("sticky")}
        title="Sticky note"
        aria-label="Add sticky note"
      >
        <I>
          <path d="M5 4h14v10l-5 5H5z" />
          <path d="M14 19v-5h5" />
        </I>
      </button>
      <div className="tool-pop" ref={nodeRef}>
        <button
          className={`tool ${nodeOpen ? "on" : ""}`}
          onClick={() => setNodeOpen((o) => !o)}
          title="Add a node (insight, actor, factor)"
          aria-label="Add a node"
          aria-haspopup="menu"
          aria-expanded={nodeOpen}
        >
          <I>
            <rect x="3" y="6" width="18" height="12" rx="3" />
            <path d="M7 6v12" />
          </I>
        </button>
        {nodeOpen && (
          <div className="tool-flyout wide" role="menu">
            {NODE_KINDS.map((n) => (
              <button
                key={n.kind}
                role="menuitem"
                className="tool-flyout-row"
                onClick={() => {
                  onAdd(n.kind);
                  setNodeOpen(false);
                }}
              >
                <I>{n.path}</I>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="tool-pop" ref={shapeRef}>
        <button
          className={`tool ${shapeOpen ? "on" : ""}`}
          onClick={() => setShapeOpen((o) => !o)}
          title="Shapes"
          aria-label="Add shape"
          aria-haspopup="menu"
          aria-expanded={shapeOpen}
        >
          <I>
            <rect x="4" y="6" width="16" height="12" rx="2" />
          </I>
        </button>
        {shapeOpen && (
          <div className="tool-flyout" role="menu">
            {SHAPES.map((s) => (
              <button
                key={s.kind}
                role="menuitem"
                className="tool"
                title={s.label}
                aria-label={`Add ${s.label.toLowerCase()}`}
                onClick={() => {
                  onAdd(s.kind);
                  setShapeOpen(false);
                }}
              >
                <I>{s.path}</I>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        className="tool"
        onClick={onAddLink}
        title="Add a link (or paste one)"
        aria-label="Add a link"
      >
        <I>
          <path d="M9 15l6-6" />
          <path d="M11 7l1-1a4 4 0 015.7 5.7l-2 2" />
          <path d="M13 17l-1 1a4 4 0 01-5.7-5.7l2-2" />
        </I>
      </button>

      <span className="tool-sep" />

      <button
        className="tool"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <I>
          <path d="M9 7L4 12l5 5" />
          <path d="M4 12h11a5 5 0 010 10h-1" />
        </I>
      </button>
      <button
        className="tool"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        <I>
          <path d="M15 7l5 5-5 5" />
          <path d="M20 12H9a5 5 0 000 10h1" />
        </I>
      </button>
    </div>
  );
}
