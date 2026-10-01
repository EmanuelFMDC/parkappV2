/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API. Empty means same origin. */
  readonly VITE_API_URL?: string
  /** 'true' starts the in-browser mock API (D-014). */
  readonly VITE_USE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
