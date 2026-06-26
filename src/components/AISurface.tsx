import { useEffect, useState } from "react";
import type { PendingFinding, RawFinding } from "../types";
import PanelIcon from "./PanelIcon";
import WaveLoader from "./WaveLoader";

interface Props {
  width: number;
  queue: PendingFinding[];
  diving: boolean;
  scanning: boolean;
  canScan: boolean;
  scanFocus: string;
  onScanFocus: (v: string) => void;
  onKeep: (id: string, finding: RawFinding) => void;
  onToss: (id: string) => void;
  onDiscuss: (p: PendingFinding) => void;
  onScan: () => void;
  onClose: () => void;
}

function ConfirmCard({
  pending,
  onKeep,
  onToss,
  onDiscuss,
}: {
  pending: PendingFinding;
  onKeep: (f: RawFinding) => void;
  onToss: () => void;
  onDiscuss: () => void;
}) {
  const f = pending.finding;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(f.title);
  const [content, setContent] = useState(f.content);

  return (
    <div
      className="surface-card"
      style={{ "--accent": pending.frameworkColor } as React.CSSProperties}
    >
      <div className="surface-card-meta">
        <span className="surface-cat">
          {pending.frameworkName} · {f.subcategory}
        </span>
        {f.flag === "big_deal" && (
          <span className="node-tag tag-leverage">leverage</span>
        )}
        {f.flag === "contradiction" && (
          <span className="node-tag tag-tension">tension</span>
        )}
      </div>

      {editing ? (
        <>
          <input
            className="surface-title-edit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="surface-content-edit"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
        </>
      ) : (
        <>
          <h3 className="surface-title">{title}</h3>
          <p className="surface-content">{content}</p>
        </>
      )}

      {f.connectsTo.length > 0 && (
        <div className="surface-connects">
          <span className="conn-type">{f.connectionType}</span>
          {f.connectsTo.map((c) => (
            <span key={c} className="conn-pill">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="surface-actions">
        {editing ? (
          <>
            <button
              className="act keep"
              onClick={() =>
                onKeep({ ...f, title: title.trim(), content: content.trim() })
              }
            >
              Save &amp; keep
            </button>
            <button className="act tweak" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="act keep"
              onClick={() =>
                onKeep({ ...f, title: title.trim(), content: content.trim() })
              }
            >
              Keep it
            </button>
            <button className="act tweak" onClick={() => setEditing(true)}>
              Tweak it
            </button>
            <button className="act toss" onClick={onToss}>
              Toss it
            </button>
          </>
        )}
      </div>

      {!editing && (
        <button className="surface-discuss" onClick={onDiscuss}>
          Bring into chat
        </button>
      )}
    </div>
  );
}

export default function AISurface({
  width,
  queue,
  diving,
  scanning,
  canScan,
  scanFocus,
  onScanFocus,
  onKeep,
  onToss,
  onDiscuss,
  onScan,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0);

  // keep the index valid as the queue grows/shrinks
  useEffect(() => {
    if (index > queue.length - 1) setIndex(Math.max(0, queue.length - 1));
  }, [queue.length, index]);

  const current = queue[index] ?? null;

  return (
    <aside className="surface" style={{ flex: `0 0 ${width}px`, width }}>
      <div className="pane-head">
        <span className="pane-title">Surface</span>
        <button className="pane-collapse" onClick={onClose} title="Collapse panel">
          <PanelIcon side="right" />
        </button>
      </div>

      {queue.length > 1 && (
        <div className="surface-nav">
          <button
            className="surface-nav-btn"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous card"
            title="Previous"
          >
            ‹
          </button>
          <span className="surface-nav-count">
            {index + 1} <span>/ {queue.length}</span>
          </span>
          <button
            className="surface-nav-btn"
            onClick={() => setIndex((i) => Math.min(queue.length - 1, i + 1))}
            disabled={index === queue.length - 1}
            aria-label="Next card"
            title="Next"
          >
            ›
          </button>
        </div>
      )}

      <div className="surface-body">
        {current ? (
          <ConfirmCard
            key={current.id}
            pending={current}
            onKeep={(finding) => onKeep(current.id, finding)}
            onToss={() => onToss(current.id)}
            onDiscuss={() => onDiscuss(current)}
          />
        ) : diving ? (
          <div className="surface-waiting">
            <WaveLoader />
            <p>Surfacing insights from the deep…</p>
          </div>
        ) : (
          <div className="surface-empty">
            <p>Nothing waiting to confirm.</p>
            <p className="surface-empty-sub">
              Dive some lenses, then keep, tweak, or toss what surfaces. Scan the
              reef to reveal connections across the canvas.
            </p>
          </div>
        )}
      </div>

      <div className="surface-foot">
        <input
          className="scan-focus"
          value={scanFocus}
          onChange={(e) => onScanFocus(e.target.value)}
          placeholder="Optional: a hunch to steer the scan…"
          disabled={scanning}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canScan && !scanning) onScan();
          }}
        />
        <button
          className="scan-btn"
          onClick={onScan}
          disabled={!canScan || scanning}
          title={canScan ? "Find patterns across the canvas" : "Add some nodes first"}
        >
          {scanning ? (
            <span className="btn-loading">
              <WaveLoader /> Scanning the reef
            </span>
          ) : (
            "Scan for Patterns"
          )}
        </button>
      </div>
    </aside>
  );
}
