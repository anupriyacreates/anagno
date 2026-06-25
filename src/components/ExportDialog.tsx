import { useEffect, useState } from "react";
import type { Node } from "@xyflow/react";
import { renderCanvasPng, downloadDataUrl, pngToPdf } from "../lib/exportCanvas";

interface Props {
  nodes: Node[];
  title: string;
  onClose: () => void;
}

type Format = "png" | "pdf";
type Scope = "all" | "selection";

function slug(s: string) {
  return (s || "canvas").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "canvas";
}

export default function ExportDialog({ nodes, title, onClose }: Props) {
  const hasSelection = nodes.some((n) => n.selected);
  const [format, setFormat] = useState<Format>("png");
  const [scope, setScope] = useState<Scope>(hasSelection ? "selection" : "all");
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const canvasBg =
        getComputedStyle(document.documentElement).getPropertyValue("--sand-light").trim() ||
        "#f5efe6";
      const background = format === "png" && transparent ? null : canvasBg;
      const { url, w, h } = await renderCanvasPng(nodes, { scope, scale, background });
      const base = `anagno-${slug(title)}-${scope}`;
      if (format === "png") downloadDataUrl(url, `${base}.png`);
      else await pngToPdf(url, w, h, `${base}.pdf`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  const Seg = <T extends string>(p: {
    value: T;
    set: (v: T) => void;
    options: { v: T; label: string; disabled?: boolean }[];
  }) => (
    <div className="export-seg">
      {p.options.map((o) => (
        <button
          key={o.v}
          className={`export-seg-btn ${p.value === o.v ? "on" : ""}`}
          disabled={o.disabled}
          onClick={() => p.set(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Export canvas"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Export</h2>

        <label className="export-row">
          <span>Format</span>
          <Seg
            value={format}
            set={setFormat}
            options={[
              { v: "png", label: "PNG" },
              { v: "pdf", label: "PDF" },
            ]}
          />
        </label>

        <label className="export-row">
          <span>Scope</span>
          <Seg
            value={scope}
            set={setScope}
            options={[
              { v: "all", label: "Whole canvas" },
              { v: "selection", label: "Selection", disabled: !hasSelection },
            ]}
          />
        </label>

        <label className="export-row">
          <span>Quality</span>
          <Seg
            value={String(scale)}
            set={(v) => setScale(Number(v))}
            options={[
              { v: "1", label: "1×" },
              { v: "2", label: "2×" },
              { v: "3", label: "3×" },
            ]}
          />
        </label>

        {format === "png" && (
          <label className="export-check">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
            />
            Transparent background
          </label>
        )}

        {error && <p className="export-error">{error}</p>}

        <div className="export-actions">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-cta" onClick={run} disabled={busy}>
            {busy ? "Exporting…" : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
