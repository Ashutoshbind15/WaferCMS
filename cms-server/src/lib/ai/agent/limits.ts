/** Defaults for the admin task ToolLoopAgent. Overridable via env / call options. */
export const AGENT_DEFAULTS = {
  /** Max LLM steps (built-in `isStepCount` stop condition). */
  maxSteps: 8,
  /** Wall-clock budget for the whole generate/stream call. */
  totalTimeoutMs: 60_000,
} as const;

export type AgentLimits = {
  maxSteps: number;
  totalTimeoutMs: number;
};

const envInt = (name: string, fallback: number): number => {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const resolveAgentLimits = (
  overrides: Partial<AgentLimits> = {},
): AgentLimits => ({
  maxSteps:
    overrides.maxSteps ??
    envInt("CMS_AI_AGENT_MAX_STEPS", AGENT_DEFAULTS.maxSteps),
  totalTimeoutMs:
    overrides.totalTimeoutMs ??
    envInt("CMS_AI_AGENT_TIMEOUT_MS", AGENT_DEFAULTS.totalTimeoutMs),
});
