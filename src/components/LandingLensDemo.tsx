// A small, non-interactive animation for the Frameworks section: lenses sitting on
// a shelf, one looping into the "Diver" bucket — the load-a-lens-then-dive moment.
// Decorative (aria-hidden); the section copy carries the meaning. Respects
// prefers-reduced-motion via CSS.
import { BUILT_IN_FRAMEWORKS } from "../data/frameworks";

const byId = (id: string) =>
  BUILT_IN_FRAMEWORKS.find((f) => f.id === id) ?? BUILT_IN_FRAMEWORKS[0];

const SHELF = ["pestel", "stakeholder-map", "causal-loop"].map(byId);
const FLY = byId("leverage-points");
const BUCKET = ["jtbd", "five-whys"].map(byId);

export default function LandingLensDemo() {
  return (
    <div className="lens-demo" aria-hidden="true">
      <div className="ld-shelf">
        {SHELF.map((f) => (
          <span className="ld-chip" key={f.id}>
            <span className="ld-dot" style={{ background: f.color }} />
            {f.name}
          </span>
        ))}
      </div>

      <span className="ld-fly">
        <span className="ld-dot" style={{ background: FLY.color }} />
        {FLY.name}
      </span>

      <div className="ld-bucket">
        <span className="ld-bucket-label">Diver · bucket</span>
        <span className="ld-bucket-row">
          {BUCKET.map((f) => (
            <span className="ld-mini" key={f.id}>
              <span className="ld-dot" style={{ background: f.color }} />
              {f.name}
            </span>
          ))}
          <span className="ld-mini ld-mini-ghost">
            <span className="ld-dot" style={{ background: FLY.color }} />
            {FLY.name}
          </span>
        </span>
        <span className="ld-dive">Dive ↓</span>
      </div>
    </div>
  );
}
