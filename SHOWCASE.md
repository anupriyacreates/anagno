# Anagno — Showcase (demo) mode

A no-backend, no-API-key build of Anagno for public demos and portfolios. Every
AI call returns hand-written canned data that looks and streams like the real
thing, so the whole app works as a **static site** — host it anywhere.

## Run it

Local (no server, no key needed):

```bash
npm install
npm run dev:demo        # http://localhost:5173
```

Static build for hosting (Netlify, Vercel, GitHub Pages, S3, …):

```bash
npm run build:demo      # outputs dist/
npm run preview:demo    # preview the built bundle locally
```

Deploy the `dist/` folder. There is no server to run and no `ANTHROPIC_API_KEY`
involved.

## What's simulated

When demo mode is on, these calls return canned content instead of hitting the
backend (with a little latency/streaming so it feels live):

- **Dive a lens** — framework-specific findings (PESTEL, Stakeholder, JTBD,
  Causal Loop have bespoke sets; every other lens gets a solid generic set).
- **Chat** — streams a systems-lens reply, lightly tailored to your question.
- **Bring into chat / Add to canvas (extract)** — turns a reply into nodes.
- **Scan for Patterns** — surfaces emerging-insight / tension / leverage nodes,
  wired to your existing canvas nodes so edges appear.
- **Follow-up suggestions** and **link unfurl** (paste a URL onto the canvas).

Everything else (canvas editing, actors/factors, signed links, keep/tweak/toss,
export to PNG / Word / PowerPoint) is already client-side and works unchanged.

## The demo project

Demo mode features a single, coherent project — **"Modular home adoption — why
value-conscious buyers hesitate on prefab homes"** — defined once in
[`src/demo/demoProject.ts`](src/demo/demoProject.ts). Every canned response
(dives, chat, scan, follow-ups) is written to match that topic, so the whole
walkthrough hangs together. Open it from the Projects screen and start diving.

To change the demo topic, edit `demoProject.ts` and the matching copy in
`src/demo/fixtures.ts`.

## How it works

- The flag lives in [`src/demo/demoMode.ts`](src/demo/demoMode.ts):
  `DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "1"`.
- [`.env.demo`](.env.demo) sets `VITE_DEMO_MODE=1`; the `:demo` npm scripts run
  Vite with `--mode demo` so that file is loaded.
- Each function in [`src/api.ts`](src/api.ts) checks `DEMO_MODE` and delegates to
  [`src/demo/mockApi.ts`](src/demo/mockApi.ts), which draws from
  [`src/demo/fixtures.ts`](src/demo/fixtures.ts).

The real app is untouched: a normal `npm run build` leaves the flag `false`, and
the demo code tree-shakes out of the production bundle entirely. To add or edit
canned responses, just edit `src/demo/fixtures.ts`.
