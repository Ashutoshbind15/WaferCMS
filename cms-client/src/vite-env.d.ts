/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_API_BASE?: string;
  /** Set to "true" to show Generate with AI. Mirrors server CMS_AI_DRAFTS_ENABLED. */
  readonly VITE_CMS_AI_DRAFTS_ENABLED?: string;
  /** Set to "true" to show the admin AI task page. Mirrors server CMS_AI_AGENT_ENABLED. */
  readonly VITE_CMS_AI_AGENT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
