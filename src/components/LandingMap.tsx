// A curated, non-interactive example of the artifact Anagno produces: research
// findings wired into a small system, with a scanned pattern + a contradiction
// flagged. Reuses the canvas visual language (finding cards + labeled connectors).

interface NodeDef {
  id: string;
  cat: string;
  title: string;
  color: string;
  left: string;
  top: string;
  variant?: "insight" | "scan" | "contra";
}

const NODES: NodeDef[] = [
  {
    id: "people",
    cat: "Stakeholders",
    title: "Power users feel unheard",
    color: "#c47c5a",
    left: "2%",
    top: "11%",
  },
  {
    id: "forces",
    cat: "PESTEL · forces",
    title: "Switching cost is low",
    color: "#7bbfb5",
    left: "60%",
    top: "5%",
  },
  {
    id: "loop",
    cat: "Pattern · scan",
    title: "Churn feeds neglect — a reinforcing loop",
    color: "#d9a23a",
    left: "29%",
    top: "41%",
    variant: "scan",
  },
  {
    id: "root",
    cat: "Root cause",
    title: "No owner for retention",
    color: "#7a9e7e",
    left: "4%",
    top: "69%",
  },
  {
    id: "contra",
    cat: "Contradiction",
    title: "…yet reported NPS is rising",
    color: "#c47c5a",
    left: "59%",
    top: "66%",
    variant: "contra",
  },
];

interface EdgeDef {
  d: string;
  label: string;
  left: string;
  top: string;
  variant?: "contra";
}

const EDGES: EdgeDef[] = [
  { d: "M20,24 C28,34 38,42 46,52", label: "causes", left: "26%", top: "34%" },
  { d: "M76,18 C66,30 56,42 46,52", label: "amplifies", left: "60%", top: "30%" },
  { d: "M22,80 C30,70 38,60 46,52", label: "feeds into", left: "27%", top: "65%" },
  {
    d: "M46,52 C58,60 68,68 76,76",
    label: "contradicts",
    left: "58%",
    top: "62%",
    variant: "contra",
  },
];

export default function LandingMap() {
  return (
    <div
      className="lmap"
      role="img"
      aria-label="Example Anagno systems map: research findings — unheard power users, low switching cost, and no retention owner — wired into a reinforcing churn loop that a pattern scan has highlighted, alongside a flagged contradiction that reported NPS is rising."
    >
      <svg
        className="lmap-edges"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {EDGES.map((e, i) => (
          <path
            key={i}
            className={`lmap-edge ${e.variant ?? ""}`}
            d={e.d}
          />
        ))}
      </svg>

      {EDGES.map((e, i) => (
        <span
          key={i}
          className={`lmap-pill ${e.variant ?? ""}`}
          style={{ left: e.left, top: e.top }}
          aria-hidden="true"
        >
          {e.label}
        </span>
      ))}

      {NODES.map((n) => (
        <div
          key={n.id}
          className={`lmap-node ${n.variant ?? ""}`}
          style={
            { left: n.left, top: n.top, "--accent": n.color } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <span className="lmap-cat">{n.cat}</span>
          <span className="lmap-title">{n.title}</span>
        </div>
      ))}

      <div className="lmap-badge" aria-hidden="true">
        <span className="lmap-badge-dot" />
        Pattern scan · 1 loop · 1 contradiction
      </div>
    </div>
  );
}
