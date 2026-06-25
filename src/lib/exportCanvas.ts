import { toPng } from "html-to-image";
import { getNodesBounds, type Node } from "@xyflow/react";

export interface ExportOpts {
  scope: "all" | "selection";
  scale: number; // 1 | 2 | 3 — output pixel multiplier
  background: string | null; // hex fill, or null for transparent
}

const PAD = 48;

/** Rasterize the React Flow nodes to a PNG data URL, framed to the chosen scope. */
export async function renderCanvasPng(
  nodes: Node[],
  opts: ExportOpts,
): Promise<{ url: string; w: number; h: number }> {
  const target =
    opts.scope === "selection" ? nodes.filter((n) => n.selected) : nodes;
  if (!target.length) {
    throw new Error(
      opts.scope === "selection"
        ? "Nothing selected — select nodes first, or export the whole canvas."
        : "The canvas is empty — nothing to export.",
    );
  }
  const viewport = document.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement | null;
  if (!viewport) throw new Error("Canvas not ready.");

  const bounds = getNodesBounds(target);
  const w = Math.ceil(bounds.width + PAD * 2);
  const h = Math.ceil(bounds.height + PAD * 2);

  const url = await toPng(viewport, {
    backgroundColor: opts.background || undefined,
    width: w,
    height: h,
    pixelRatio: opts.scale,
    style: {
      width: `${w}px`,
      height: `${h}px`,
      transform: `translate(${-bounds.x + PAD}px, ${-bounds.y + PAD}px) scale(1)`,
    },
    // don't bake the minimap / controls overlays into the export
    filter: (node) => {
      const el = node as HTMLElement;
      const c = el.classList;
      return !(
        c &&
        (c.contains("react-flow__minimap") ||
          c.contains("react-flow__controls") ||
          c.contains("react-flow__attribution"))
      );
    },
  });
  return { url, w: w * opts.scale, h: h * opts.scale };
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Wrap a PNG data URL in a single-page PDF sized exactly to the image. */
export async function pngToPdf(
  url: string,
  pxW: number,
  pxH: number,
  filename: string,
) {
  const { jsPDF } = await import("jspdf");
  const orientation = pxW >= pxH ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [pxW, pxH] });
  pdf.addImage(url, "PNG", 0, 0, pxW, pxH);
  pdf.save(filename);
}
