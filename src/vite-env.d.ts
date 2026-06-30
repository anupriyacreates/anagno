/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" enables showcase/demo mode — all API calls return canned data, no backend or key needed. */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
