/** Build-time gate for AI item drafts. */
export const aiDraftsEnabled =
  import.meta.env.VITE_CMS_AI_DRAFTS_ENABLED === "true";

/** Build-time gate for the admin AI task agent UI. */
export const aiAgentEnabled =
  import.meta.env.VITE_CMS_AI_AGENT_ENABLED === "true";
