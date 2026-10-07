/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API. Empty means same origin. */
  readonly VITE_API_URL?: string
  /** 'true' starts the in-browser mock API. */
  readonly VITE_USE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
