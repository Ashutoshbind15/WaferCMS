type RuntimeEnv = {
  CMS_API_BASE?: string;
  CMS_AI_DRAFTS_ENABLED?: string;
  CMS_AI_AGENT_ENABLED?: string;
};

declare global {
  interface Window {
    __ENV?: RuntimeEnv;
  }
}

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

const runtimeFlag = (value: string | undefined): boolean | undefined => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return undefined;
};

/** Prefer container-injected `window.__ENV`, then Vite env (local `pnpm dev`). */
export function getCmsApiBase(): string {
  const fromRuntime = window.__ENV?.CMS_API_BASE?.trim();
  if (fromRuntime) {
    return trimTrailingSlash(fromRuntime);
  }

  const fromVite = import.meta.env.VITE_CMS_API_BASE?.trim();
  if (fromVite) {
    return trimTrailingSlash(fromVite);
  }

  return "http://localhost:3001";
}

export function isAiDraftsEnabled(): boolean {
  return (
    runtimeFlag(window.__ENV?.CMS_AI_DRAFTS_ENABLED) ??
    import.meta.env.VITE_CMS_AI_DRAFTS_ENABLED === "true"
  );
}

export function isAiAgentEnabled(): boolean {
  return (
    runtimeFlag(window.__ENV?.CMS_AI_AGENT_ENABLED) ??
    import.meta.env.VITE_CMS_AI_AGENT_ENABLED === "true"
  );
}
