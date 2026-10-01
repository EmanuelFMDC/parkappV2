/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API. Empty means same origin. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
