/** Deploy-time gate for AI item drafts. Off by default. */
export const isAiDraftsEnabled = (): boolean =>
  process.env.CMS_AI_DRAFTS_ENABLED === "true";

/** Deploy-time gate for admin AI task agent. Off by default. */
export const isAiAgentEnabled = (): boolean =>
  process.env.CMS_AI_AGENT_ENABLED === "true";
