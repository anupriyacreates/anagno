// Sidebar/panel toggle icon — a framed panel with the side strip shaded,
// matching the "collapse side panel" icon family.
export default function PanelIcon({ side }: { side: "left" | "right" }) {
  const divX = side === "left" ? 9 : 15;
  const fillX = side === "left" ? 3 : 15;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <rect
        x={fillX}
        y="5"
        width="6"
        height="14"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        opacity="0.22"
      />
      <line x1={divX} y1="5" x2={divX} y2="19" />
    </svg>
  );
}
