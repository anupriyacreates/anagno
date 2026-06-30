import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import { DEMO_MODE } from "./demo/demoMode";
import { DEMO_PROJECT } from "./demo/demoProject";

interface Props {
  onOpen: (p: { id: string; name: string; context: string }) => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const PROJECTS = [
  {
    id: "research-retention",
    name: "Research retention",
    desc: "Why insights die after a project ends",
    edited: "Edited 2 days ago",
    hue: "#7bbfb5",
    context:
      "Remote-first design teams lose research insights after a project ends. Insights get buried in docs and Figma boards; new hires repeat old research. Users: design leads and PMs at 50–200 person product companies.",
  },
  {
    id: "onboarding-friction",
    name: "Onboarding friction",
    desc: "First-week drop-off for new PMs",
    edited: "Edited 1 week ago",
    hue: "#c47c5a",
    context:
      "New product managers stall in their first two weeks — unclear ownership, scattered context, and no clear first win. We want to understand what slows time-to-first-contribution.",
  },
  {
    id: "marketplace-trust",
    name: "Marketplace trust",
    desc: "Buyer/seller confidence loops",
    edited: "Edited 3 weeks ago",
    hue: "#7a9e7e",
    context:
      "A two-sided marketplace where buyers hesitate without reviews and sellers won't invest without buyers. We're exploring the trust dynamics and where the loop can be broken open.",
  },
];

export default function Projects({
  onOpen,
  onLogout,
  theme,
  onToggleTheme,
}: Props) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");

  // In showcase mode, feature the single demo project (all canned content
  // matches its topic). The real app shows the full sample set.
  const projectList = DEMO_MODE ? [DEMO_PROJECT] : PROJECTS;

  function create() {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `proj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onOpen({
      id,
      name: name.trim() || "Untitled project",
      context: context.trim(),
    });
  }

  return (
    <div className="projects">
      <header className="projects-nav">
        <button className="lander-brand as-btn" onClick={onLogout} title="Home">
          <span className="brand-dot" />
          Anagno
        </button>
        <div className="lander-nav-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="projects-main">
        <div className="projects-head">
          <h1>Your projects</h1>
          <p>Pick up where you left off, or start a fresh dive.</p>
        </div>

        <div className="projects-grid">
          <button className="project-card new" onClick={() => setSetupOpen(true)}>
            <span className="project-plus">+</span>
            New project
          </button>

          {projectList.map((p) => (
            <button
              key={p.name}
              className="project-card"
              onClick={() => onOpen({ id: p.id, name: p.name, context: p.context })}
            >
              <span className="project-banner" style={{ background: p.hue }} />
              <span className="project-name">{p.name}</span>
              <span className="project-desc">{p.desc}</span>
              <span className="project-edited">{p.edited}</span>
            </button>
          ))}
        </div>
      </main>

      {setupOpen && (
        <div className="modal-scrim" onClick={() => setSetupOpen(false)}>
          <div className="login-card" onClick={(e) => e.stopPropagation()}>
            <h2>New project</h2>
            <p className="login-sub">
              Name it and set the research context — what you're exploring, who it's
              for, and the scope. You can edit this later from the workspace.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <label className="field">
                <span>Project name</span>
                <input
                  autoFocus
                  placeholder="e.g. Checkout abandonment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Research context</span>
                <textarea
                  className="field-textarea"
                  rows={4}
                  placeholder="The problem space, the people, the scope…"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </label>
              <button type="submit" className="btn-cta full">
                Create project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
