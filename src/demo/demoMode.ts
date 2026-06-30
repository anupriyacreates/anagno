// Showcase / demo mode.
//
// When VITE_DEMO_MODE is "1" (set via `.env.demo`, used by the `:demo` npm
// scripts), every function in `src/api.ts` short-circuits to canned data in
// `src/demo/mockApi.ts` instead of calling the Express + Anthropic backend.
//
// That makes the app fully static: no server, no API key, no network — perfect
// for hosting a public showcase. The real build is untouched (flag defaults off).
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "1";
