/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Local Vite only. Published images use window.__ENV.CMS_API_BASE from /config.js. */
  readonly VITE_CMS_API_BASE?: string;
  /** Local Vite only. Container uses CMS_AI_DRAFTS_ENABLED → window.__ENV. */
  readonly VITE_CMS_AI_DRAFTS_ENABLED?: string;
  /** Local Vite only. Container uses CMS_AI_AGENT_ENABLED → window.__ENV. */
  readonly VITE_CMS_AI_AGENT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
