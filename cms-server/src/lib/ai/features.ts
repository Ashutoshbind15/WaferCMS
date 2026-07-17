/** Deploy-time gate for AI item drafts. Off by default. */
export const isAiDraftsEnabled = (): boolean =>
  process.env.CMS_AI_DRAFTS_ENABLED === "true";
