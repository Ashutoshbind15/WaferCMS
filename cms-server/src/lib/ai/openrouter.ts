import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY?.trim() || null;
const defaultModel =
  process.env.OPENROUTER_DEFAULT_MODEL?.trim() || "openai/gpt-4o-mini";

let cached: ReturnType<typeof createOpenRouter> | null = null;

export const getDefaultAiModel = (): string => defaultModel;

/** Fail boot when AI drafting cannot run. Call once during server start. */
export const requireOpenRouterApiKey = (): void => {
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it to enable the server.",
    );
  }
};

export const getOpenRouter = () => {
  if (!cached) {
    cached = createOpenRouter({ apiKey: apiKey! });
  }
  return cached;
};
