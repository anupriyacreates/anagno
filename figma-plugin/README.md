# Anagno Design Kit — Figma plugin

A one-shot generator that builds Anagno's design system and key screens **inside a
Figma document**, straight from the app's real tokens (`src/styles.css`) and component
specs. (Figma files can't be authored from outside Figma — this plugin is the
faithful, self-contained way to get the design into Figma.)

## What it creates

Three pages:

- **01 Foundations** — color **styles** (`Anagno/Light/*`, `Anagno/Dark/*`), text
  **styles** (`Anagno/Display|Heading|Title|Body|Label|Mono`), plus visible swatch grids
  and a type specimen.
- **02 Components** — buttons (CTA + ghost), finding/Diver node cards (incl. scan +
  dark variants), **Actor / Factor systems nodes** (kind badge + actor power/interest/stance
  chips), **signed (+/−) causal links**, framework chips, panel headers (Caveat), and the
  chat + lens composer.
- **03 Screens** — a **Landing** frame (nav, hero, systems-map preview, How-it-works
  cards) and a **Workspace** frame (top bar with the loud Export action, dark Dive panel +
  chat, canvas with actor/factor nodes + signed links, Surface with the confirm-card
  carousel + Scan for Patterns).

## Run it

1. Open **Figma desktop** (plugins in development require the desktop app).
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select `figma-plugin/manifest.json` from this repo.
4. Open any file → **Plugins → Development → Anagno Design Kit**.
5. It runs once, builds the three pages, and closes. Open the **01 Foundations** page to
   start; check the right-hand **Local styles** to see the generated color/text styles.

## Notes

- **Fonts:** Plus Jakarta Sans, Caveat, and Roboto Mono are Google fonts Figma ships
  with. If any isn't available in your Figma, the plugin falls back to Inter (the text
  still generates).
- **Fidelity:** this is a clean, on-brand recreation via the Figma Plugin API — close to
  the live app, but not a pixel-perfect render of the CSS (e.g. the canvas dot-grid and
  grain/wave textures are omitted). Re-running creates a fresh set of pages each time.
- **Re-generating:** delete the old `01/02/03` pages before re-running if you want a
  clean rebuild (the plugin always appends new pages).
