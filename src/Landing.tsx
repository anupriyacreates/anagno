import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import LandingMap from "./components/LandingMap";
import LandingLensDemo from "./components/LandingLensDemo";
import { BUILT_IN_FRAMEWORKS } from "./data/frameworks";

interface Props {
  onEnter: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const STEPS = [
  {
    k: "01",
    t: "Research from a systems lens",
    d: "Run your problem space through proven frameworks at once — PESTEL, stakeholders, causal loops.",
  },
  {
    k: "02",
    t: "Stay in control of every insight",
    d: "Findings surface one at a time. Keep, tweak, or toss — nothing lands on your canvas without you.",
  },
  {
    k: "03",
    t: "See the system, not a list",
    d: "Insights become connected nodes. Scan for patterns to surface loops, tensions, and leverage points.",
  },
];

const USE_CASES = [
  {
    t: "Product designers",
    d: "Map the messy problem behind a feature request before you open Figma — and keep the why next to the what.",
  },
  {
    t: "User researchers",
    d: "Turn interviews and desk research into a living system of insights, not another report nobody reopens.",
  },
  {
    t: "Product managers",
    d: "Pressure-test a problem space from every angle, spot the leverage points, and align the team on what actually matters.",
  },
];

// distinct framework categories, in first-seen order, with a representative colour
const CATEGORIES = (() => {
  const seen: { name: string; color: string; count: number }[] = [];
  for (const f of BUILT_IN_FRAMEWORKS) {
    const g = seen.find((c) => c.name === f.category);
    if (g) g.count += 1;
    else seen.push({ name: f.category, color: f.color, count: 1 });
  }
  return seen;
})();

// fictional placeholder companies for the social-proof strip — each gets a distinct
// mark + wordmark treatment so the row reads like real, varied logos.
type LogoVariant =
  | "compass"
  | "sun"
  | "peaks"
  | "stones"
  | "rings"
  | "monogram";
const LOGOS: { name: string; variant: LogoVariant }[] = [
  { name: "Northwind", variant: "compass" },
  { name: "Lumen", variant: "sun" },
  { name: "Fjord Labs", variant: "peaks" },
  { name: "Cairn", variant: "stones" },
  { name: "Meridian", variant: "rings" },
  { name: "Halcyon", variant: "monogram" },
];

function LogoMark({ variant }: { variant: LogoVariant }) {
  const common = {
    className: "logo-glyph",
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;
  switch (variant) {
    case "compass":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12l4-6-6 4-4 6z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" opacity="0.5" />
        </svg>
      );
    case "peaks":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M2 20L9 7l4 7 3-5 6 11z" />
        </svg>
      );
    case "stones":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="6" y="4" width="12" height="4" rx="2" opacity="0.55" />
          <rect x="4" y="10" width="16" height="4" rx="2" opacity="0.8" />
          <rect x="7" y="16" width="10" height="4" rx="2" />
        </svg>
      );
    case "rings":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
        </svg>
      );
    case "monogram":
      return (
        <svg {...common} fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            fill="currentColor"
          />
          <path
            d="M9 8v8M15 8v8M9 12h6"
            stroke="var(--sand-light)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

const CHANGELOG = [
  {
    ver: "v0.5",
    date: "Jun 2026",
    note: "Star & pin individual chat responses; pinned replies stay one tap away.",
  },
  {
    ver: "v0.4",
    date: "May 2026",
    note: "Pattern scan now flags contradictions and emerging insights across the map.",
  },
  {
    ver: "v0.3",
    date: "Apr 2026",
    note: "Framework library by category, plus custom lenses you define yourself.",
  },
  {
    ver: "v0.2",
    date: "Mar 2026",
    note: "Infinite canvas with editable, floating connectors between findings.",
  },
];

export default function Landing({ onEnter, theme, onToggleTheme }: Props) {
  const [authMode, setAuthMode] = useState<null | "signin" | "signup">(null);
  const [productOpen, setProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const prodBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const loginCardRef = useRef<HTMLDivElement>(null);

  // login modal: close on Escape, autofocus first field on open
  useEffect(() => {
    if (!authMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthMode(null);
    };
    document.addEventListener("keydown", onKey);
    loginCardRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [authMode]);

  // close the Product dropdown on outside-click or Escape
  useEffect(() => {
    if (!productOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!productRef.current?.contains(e.target as Node)) setProductOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProductOpen(false);
        prodBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    // move focus into the menu when it opens
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [productOpen]);

  function onMenuKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ??
        [],
    );
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1) % items.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  }

  function scrollTo(id: string) {
    setProductOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="lander">
      <header className="lander-topbar">
      <nav className="lander-nav">
        <div className="lander-brand">
          <span className="brand-dot" />
          Anagno
        </div>

        <div className="nav-links">
          <div className="nav-prod" ref={productRef}>
            <button
              ref={prodBtnRef}
              className={`nav-link nav-prod-btn ${productOpen ? "on" : ""}`}
              onClick={() => setProductOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && !productOpen) {
                  e.preventDefault();
                  setProductOpen(true);
                }
              }}
              aria-haspopup="menu"
              aria-expanded={productOpen}
              aria-controls="nav-product-menu"
            >
              Product
              <svg
                className="nav-caret"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {productOpen && (
              <div
                className="nav-menu"
                id="nav-product-menu"
                role="menu"
                ref={menuRef}
                onKeyDown={onMenuKey}
              >
                <button role="menuitem" onClick={() => scrollTo("how")}>
                  <span className="nav-menu-t">How it works</span>
                  <span className="nav-menu-d">From context to a connected map</span>
                </button>
                <button role="menuitem" onClick={() => scrollTo("frameworks")}>
                  <span className="nav-menu-t">Frameworks</span>
                  <span className="nav-menu-d">A library of research lenses</span>
                </button>
                <button role="menuitem" onClick={() => scrollTo("canvas")}>
                  <span className="nav-menu-t">Canvas</span>
                  <span className="nav-menu-d">An infinite, systems-first board</span>
                </button>
              </div>
            )}
          </div>
          <button className="nav-link" onClick={() => scrollTo("usecases")}>
            Use cases
          </button>
          <button className="nav-link" onClick={() => scrollTo("pricing")}>
            Pricing
          </button>
          <button className="nav-link" onClick={() => scrollTo("changelog")}>
            Changelog
          </button>
          <button className="nav-link" onClick={() => scrollTo("contact")}>
            Contact
          </button>
        </div>

        <div className="lander-nav-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn-ghost" onClick={() => setAuthMode("signin")}>
            Log in
          </button>
          <button className="btn-cta nav-signup" onClick={() => setAuthMode("signup")}>
            Sign up
          </button>
        </div>
      </nav>
      </header>

      <header className="hero" id="canvas">
        <div className="hero-copy">
          <div className="hero-eyebrow">AI-native research canvas</div>
          <h1 className="hero-title">
            Find the real problem,
            <br />
            not just the obvious one.
          </h1>
          <p className="hero-sub">
            Anagno blends an AI research companion with an infinite canvas, so
            designers and researchers can explore a problem space from a systems
            lens — and watch the connections surface.
          </p>
          <div className="hero-cta">
            <button className="btn-cta" onClick={() => setAuthMode("signup")}>
              Get started
            </button>
            <button className="btn-ghost lg" onClick={() => scrollTo("how")}>
              See how it works
            </button>
          </div>
        </div>
        <LandingMap />
      </header>

      <section className="logo-strip" aria-label="Trusted by research and design teams">
        <span className="logo-eyebrow">Trusted by research &amp; design teams</span>
        <div className="logo-row">
          {LOGOS.map((logo) => (
            <span className={`logo-item lg-${logo.variant}`} key={logo.name}>
              <LogoMark variant={logo.variant} />
              {logo.name === "Fjord Labs" ? (
                <span className="logo-word">
                  Fjord<span className="lg-soft"> Labs</span>
                </span>
              ) : (
                <span className="logo-word">{logo.name}</span>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="how" id="how">
        {STEPS.map((s) => (
          <div className="how-card" key={s.k}>
            <div className="how-k">{s.k}</div>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </div>
        ))}
      </section>

      <section className="band fw-moment" id="frameworks">
        <div className="fw-copy">
          <div className="hero-eyebrow">Framework library</div>
          <h2>Load a lens. Dive. Watch findings surface.</h2>
          <p>
            Stack proven lenses into the Diver and run them together — or define your
            own. Anagno works your problem space through each and surfaces findings you
            keep, edit, or toss.
          </p>
          <div className="fw-grid">
            {CATEGORIES.map((c) => (
              <div className="fw-chip" key={c.name}>
                <span className="fw-dot" style={{ background: c.color }} />
                <span className="fw-name">{c.name}</span>
                <span className="fw-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <LandingLensDemo />
      </section>

      <section className="quote-band">
        <p className="quote-mark">&ldquo;</p>
        <blockquote>
          The first tool that made our research feel like a system instead of a
          graveyard of docs. We found the loop we'd been missing in an afternoon.
        </blockquote>
        <p className="quote-cite">
          Maya Okonkwo · Head of UX Research, Meridian
        </p>
      </section>

      <section className="band alt" id="usecases">
        <div className="band-head">
          <div className="hero-eyebrow">Use cases</div>
          <h2>Built for the people who frame problems</h2>
        </div>
        <div className="how">
          {USE_CASES.map((u) => (
            <div className="how-card" key={u.t}>
              <h3>{u.t}</h3>
              <p>{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="band pricing-soon" id="pricing">
        <div className="hero-eyebrow">Pricing</div>
        <h2>Simple pricing is on the way</h2>
        <p>
          Anagno is free while in early access. Transparent plans land soon — start
          diving now and you'll be grandfathered in.
        </p>
        <button className="btn-cta" onClick={() => setAuthMode("signup")}>
          Get started
        </button>
      </section>

      <section className="band changelog-band" id="changelog">
        <div className="band-head">
          <div className="hero-eyebrow">Changelog</div>
          <h2>What's new</h2>
          <p>Shipping every few weeks. A few of the latest.</p>
        </div>
        <ul className="changelog">
          {CHANGELOG.map((c) => (
            <li className="clog-item" key={c.ver}>
              <span className="clog-meta">
                <span className="clog-ver">{c.ver}</span>
                <span className="clog-date">{c.date}</span>
              </span>
              <span className="clog-note">{c.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cta-band">
        <h2>Ready to find the real problem?</h2>
        <p>Set a context, load a lens, and watch the system surface.</p>
        <button className="btn-cta lg" onClick={() => setAuthMode("signup")}>
          Get started
        </button>
      </section>

      <footer className="lander-foot" id="contact">
        <div className="foot-top">
          <div className="foot-brand">
            <div className="lander-brand">
              <span className="brand-dot" />
              Anagno
            </div>
            <p>Problem discovery, from the surface to the reef.</p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <span className="foot-h">Product</span>
              <button className="foot-link" onClick={() => scrollTo("how")}>
                How it works
              </button>
              <button className="foot-link" onClick={() => scrollTo("frameworks")}>
                Frameworks
              </button>
              <button className="foot-link" onClick={() => scrollTo("canvas")}>
                Canvas
              </button>
            </div>
            <div className="foot-col">
              <span className="foot-h">Company</span>
              <button className="foot-link" onClick={() => scrollTo("usecases")}>
                Use cases
              </button>
              <a className="foot-link" href="mailto:hello@anagno.app">
                Contact
              </a>
              <button className="foot-link" onClick={() => setAuthMode("signup")}>
                Sign up
              </button>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Anagno</span>
          <span>Made for researchers &amp; designers</span>
        </div>
      </footer>

      {authMode && (
        <div className="modal-scrim" onClick={() => setAuthMode(null)}>
          <div
            className="login-card"
            ref={loginCardRef}
            role="dialog"
            aria-modal="true"
            aria-label={authMode === "signup" ? "Create your workspace" : "Log in"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-brand">
              <span className="brand-dot" />
              Anagno
            </div>
            <h2>{authMode === "signup" ? "Create your workspace" : "Welcome back"}</h2>
            <p className="login-sub">
              {authMode === "signup"
                ? "Set up your account to start diving."
                : "Sign in to your workspace."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEnter();
              }}
            >
              <label className="field">
                <span>Email</span>
                <input type="email" placeholder="you@studio.com" defaultValue="" />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" placeholder="••••••••" defaultValue="" />
              </label>
              <button type="submit" className="btn-cta full">
                {authMode === "signup" ? "Sign up" : "Sign in"}
              </button>
            </form>
            <p className="login-demo">
              {authMode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button className="link-btn" onClick={() => setAuthMode("signin")}>
                    Log in
                  </button>
                </>
              ) : (
                <>
                  New to Anagno?{" "}
                  <button className="link-btn" onClick={() => setAuthMode("signup")}>
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
