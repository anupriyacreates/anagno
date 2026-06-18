export type Tool = "select" | "hand";
export type AddKind = "text" | "sticky" | "shape-rect" | "shape-ellipse";

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
      <button
        className="tool"
        onClick={() => onAdd("shape-rect")}
        title="Shape"
        aria-label="Add shape"
      >
        <I>
          <rect x="4" y="6" width="16" height="12" rx="2" />
        </I>
      </button>
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
