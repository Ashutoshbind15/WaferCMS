import {
  isAiAgentEnabled,
  isAiDraftsEnabled,
} from "@/lib/runtime-config";

/** Runtime (container) or Vite gate for AI item drafts. */
export const aiDraftsEnabled = isAiDraftsEnabled();

/** Runtime (container) or Vite gate for the admin AI task agent UI. */
export const aiAgentEnabled = isAiAgentEnabled();
