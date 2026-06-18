# Anagno 🤿

A research canvas that explores a problem space **from a systems lens**. An AI
companion runs proven frameworks (PESTEL, stakeholders, causal loops, value
proposition…) **scoped to whatever you ask**, surfaces findings **one at a time** to
keep / tweak / toss, and wires them into a Miro-style **infinite canvas** where you
can scan for patterns — loops, tensions, and leverage points.

Built for product designers, user researchers, and PMs in the messy,
pre-solution phase.

## The flow

1. **Dive panel** — set your research context, then ask a question with one or more
   **lenses** attached. Each lens runs scoped to your query (e.g. "what do carpenters
   value?" through _Value Proposition_ → carpenter-specific findings). Ask with no
   lens for a normal chat.
2. **Surface** — findings arrive one at a time; **keep, tweak, or toss** each.
3. **Canvas** — kept findings drop onto an editable infinite canvas as nodes with
   typed, labelled connections (`causes`, `contradicts`, `supports`, `amplifies`,
   `feeds into`).
4. **Pattern scan** — look across the whole map for non-obvious tensions, feedback
   loops, and leverage points.

## Stack

- **Frontend:** Vite + React 19 + TypeScript, [@xyflow/react](https://reactflow.dev) canvas
- **Backend:** Express 5 + the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) (`claude-opus-4-8`, adaptive thinking + structured outputs)
- One design system (CSS tokens), light + dark themes. The API key stays server-side.

## Local development

Requires Node ≥ 20 and an Anthropic API key.

```bash
npm install
cp .env.example .env        # then put your key in .env
npm run dev                 # Express API on :8787, Vite on :5173 (proxies /api)
```

Open http://localhost:5173.

### Environment

| Var                 | Required | Notes                            |
| ------------------- | -------- | -------------------------------- |
| `ANTHROPIC_API_KEY` | yes      | Get one at console.anthropic.com |
| `PORT`              | no       | Defaults to `8787`               |
| `DIVER_MODEL`       | no       | Defaults to `claude-opus-4-8`    |

`.env` is gitignored — **never commit your key.**

## Production / deploy

In production the Express server also serves the built client (`dist/`), so it runs
as a single Node web service:

```bash
npm install
npm run build               # builds dist/
npm start                   # serves the app + /api on $PORT
```

### Deploy to Render (one service)

A `render.yaml` blueprint is included:

1. Push this repo to GitHub.
2. render.com → **New → Blueprint** → select this repo.
3. Set `ANTHROPIC_API_KEY` (use a **fresh** key) as a secret env var in the dashboard.

Any Node host (Railway, Fly, a VPS) works the same way: build, then `npm start`,
with `ANTHROPIC_API_KEY` set as a secret.

## Scripts

| Script              | Does                                       |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | API (watch) + Vite dev server              |
| `npm run build`     | Build the client to `dist/`                |
| `npm start`         | Run the server (serves `dist/` + `/api`)   |
| `npm run typecheck` | `tsc --noEmit`                             |

## Layout

```
server/
  index.ts        Express app — /api/dive, /api/scan, /api/chat, /api/extract, …
  prompts.ts      Anagno persona, prompts, and output schemas
src/
  App.tsx         landing → projects → workspace
  Landing.tsx     marketing landing page
  api.ts          fetch helpers
  data/frameworks.ts   built-in lens registry
  components/
    Workspace.tsx      state machine (dive, queue, canvas, history)
    DiverPanel.tsx     left rail: chat threads + lens composer
    ChatPanel.tsx      chat engine (stream / lens-scoped dive)
    AISurface.tsx      right rail: keep / tweak / toss
    Board.tsx          React Flow canvas + toolbar
    DiverNode.tsx      custom finding node
```
