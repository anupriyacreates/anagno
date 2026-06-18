interface Props {
  x: number;
  y: number;
  locked: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onFront: () => void;
  onBack: () => void;
  onLock: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  locked,
  onDuplicate,
  onDelete,
  onFront,
  onBack,
  onLock,
}: Props) {
  // keep the menu on-screen
  const style: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 210),
    top: Math.min(y, window.innerHeight - 220),
  };
  return (
    <div className="ctx-menu" style={style} onContextMenu={(e) => e.preventDefault()}>
      <button className="ctx-item" onClick={onDuplicate}>
        Duplicate <span className="ctx-key">Ctrl+D</span>
      </button>
      <button className="ctx-item" onClick={onLock}>
        {locked ? "Unlock" : "Lock"} <span className="ctx-key">Ctrl+L</span>
      </button>
      <div className="ctx-sep" />
      <button className="ctx-item" onClick={onFront}>
        Bring to front <span className="ctx-key">]</span>
      </button>
      <button className="ctx-item" onClick={onBack}>
        Send to back <span className="ctx-key">[</span>
      </button>
      <div className="ctx-sep" />
      <button className="ctx-item danger" onClick={onDelete}>
        Delete <span className="ctx-key">⌫</span>
      </button>
    </div>
  );
}
