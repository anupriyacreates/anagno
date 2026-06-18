import { type ReactNode } from "react";

// Lightweight markdown for chat replies: bold, italics, inline code,
// bullet/numbered lists, headings, and paragraphs with line breaks.
function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) nodes.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] != null) nodes.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] != null) nodes.push(<em key={key++}>{m[4]}</em>);
    else if (m[5] != null) nodes.push(<code key={key++}>{m[5]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const BULLET = /^\s*[-*–•]\s+/;
const NUMBERED = /^\s*\d+\.\s+/;
const HEADING = /^(#{1,4})\s+(.*)$/;

export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const h = line.match(HEADING);
    if (h) {
      blocks.push(
        <p key={key++} className={`md-h md-h${h[1].length}`}>
          {inline(h[2])}
        </p>,
      );
      i++;
      continue;
    }

    if (BULLET.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(<li key={items.length}>{inline(lines[i].replace(BULLET, ""))}</li>);
        i++;
      }
      blocks.push(
        <ul key={key++} className="md-ul">
          {items}
        </ul>,
      );
      continue;
    }

    if (NUMBERED.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && NUMBERED.test(lines[i])) {
        items.push(<li key={items.length}>{inline(lines[i].replace(NUMBERED, ""))}</li>);
        i++;
      }
      blocks.push(
        <ol key={key++} className="md-ol">
          {items}
        </ol>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i]) &&
      !HEADING.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="md-p">
        {para.map((l, idx) => (
          <span key={idx}>
            {inline(l)}
            {idx < para.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>,
    );
  }

  return <div className="md">{blocks}</div>;
}
