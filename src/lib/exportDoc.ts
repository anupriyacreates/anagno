import { downloadDataUrl } from "./exportCanvas";

export interface DocFinding {
  title: string;
  category: string;
  content: string;
}

/** Export the findings as a real Word document (.docx). */
export async function exportDocx(
  title: string,
  findings: DocFinding[],
  filename: string,
) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${findings.length} finding${findings.length === 1 ? "" : "s"}`,
          italics: true,
          color: "6b5c4e",
        }),
      ],
    }),
  ];
  for (const f of findings) {
    children.push(new Paragraph({ text: f.title, heading: HeadingLevel.HEADING_2 }));
    if (f.category)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: f.category, italics: true, color: "5c8a62" })],
        }),
      );
    if (f.content) children.push(new Paragraph({ text: f.content }));
  }
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

/** Export the findings as a real PowerPoint deck (.pptx) — one slide per finding. */
export async function exportPptx(
  title: string,
  findings: DocFinding[],
  filename: string,
) {
  const Pptx = (await import("pptxgenjs")).default;
  const p = new Pptx();
  p.defineLayout({ name: "ANAGNO", width: 10, height: 5.63 });
  p.layout = "ANAGNO";

  const cover = p.addSlide();
  cover.background = { color: "0D2137" };
  cover.addText(title, {
    x: 0.6,
    y: 1.9,
    w: 8.8,
    h: 1.4,
    fontSize: 40,
    bold: true,
    color: "F3EEFE",
  });
  cover.addText(`${findings.length} finding${findings.length === 1 ? "" : "s"}`, {
    x: 0.6,
    y: 3.3,
    fontSize: 16,
    color: "A8D5CB",
  });

  for (const f of findings) {
    const s = p.addSlide();
    if (f.category)
      s.addText(f.category.toUpperCase(), {
        x: 0.6,
        y: 0.5,
        fontSize: 12,
        bold: true,
        color: "5C8A62",
        charSpacing: 1,
      });
    s.addText(f.title, {
      x: 0.6,
      y: 0.95,
      w: 8.8,
      h: 1.3,
      fontSize: 28,
      bold: true,
      color: "2D2416",
    });
    if (f.content)
      s.addText(f.content, {
        x: 0.6,
        y: 2.3,
        w: 8.8,
        h: 2.8,
        fontSize: 16,
        color: "4A4030",
        valign: "top",
      });
  }
  await p.writeFile({ fileName: filename });
}
