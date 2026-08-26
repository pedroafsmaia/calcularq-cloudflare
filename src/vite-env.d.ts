/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_REQUIRE_PAYMENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
