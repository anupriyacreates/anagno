import { useEffect, useRef } from "react";
import type { FrameworkDef } from "../types";

interface Props {
  library: FrameworkDef[];
  bucket: FrameworkDef[];
  onToggle: (f: FrameworkDef) => void;
  onClose: () => void;
}

export default function FrameworkLibrary({
  library,
  bucket,
  onToggle,
  onClose,
}: Props) {
  const inBucket = (id: string) => bucket.some((f) => f.id === id);
  const modalRef = useRef<HTMLDivElement>(null);

  // close on Escape; move focus into the dialog on open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // group by category, preserving first-seen order
  const groups: { category: string; items: FrameworkDef[] }[] = [];
  for (const f of library) {
    let g = groups.find((x) => x.category === f.category);
    if (!g) {
      g = { category: f.category, items: [] };
      groups.push(g);
    }
    g.items.push(f);
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="lib-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Framework library"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lib-head">
          <div>
            <h2>Framework library</h2>
            <p>Browse by category — click to add a lens to your bucket.</p>
          </div>
          <button className="lib-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="lib-body">
          {groups.map((g) => (
            <section key={g.category} className="lib-group">
              <div className="lib-cat">{g.category}</div>
              <div className="lib-items">
                {g.items.map((f) => {
                  const added = inBucket(f.id);
                  return (
                    <button
                      key={f.id}
                      className={`lib-item ${added ? "added" : ""}`}
                      style={{ "--accent": f.color } as React.CSSProperties}
                      onClick={() => onToggle(f)}
                      title={f.description}
                    >
                      <span
                        className="lib-item-dot"
                        style={{ background: f.color }}
                      />
                      <span className="lib-item-text">
                        <span className="lib-item-name">{f.name}</span>
                        <span className="lib-item-desc">{f.description}</span>
                      </span>
                      <span className="lib-item-add">
                        {added ? (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
