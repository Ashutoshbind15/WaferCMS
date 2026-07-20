import { isStepCount, ToolLoopAgent, type ToolSet } from "ai";
import {
  createCmsTools,
  type CreateCmsToolsOptions,
} from "../tools/cms/index.js";
import { getDefaultAiModel, getOpenRouter } from "../openrouter.js";
import { resolveAgentLimits, type AgentLimits } from "./limits.js";
import { AGENT_SYSTEM_PROMPT } from "./prompt.js";

export type CreateAgentOptions = {
  model?: string;
  instructions?: string;
  limits?: Partial<AgentLimits>;
  tools?: ToolSet;
  cmsTools?: CreateCmsToolsOptions;
};

/** Single-turn task input — one prompt in, one result out (no chat history). */
export type AgentRunInput = {
  prompt: string;
  abortSignal?: AbortSignal;
};

export type AgentRunResult = {
  text: string;
  model: string;
  finishReason: string;
  /** Tool calls made during the run (from the AI SDK result). */
  toolCalls: Array<{
    toolCallId: string;
    toolName: string;
    input: unknown;
  }>;
  /**
   * Matching tool outputs. Each `output` is a client-safe CmsToolResult
   * (`{ ok, data }` / `{ ok: false, error, code }`) from the tool layer.
   */
  toolResults: Array<{
    toolCallId: string;
    toolName: string;
    output: unknown;
  }>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export const createAgent = (options: CreateAgentOptions = {}) => {
  const limits = resolveAgentLimits(options.limits);
  const modelId = options.model?.trim() || getDefaultAiModel();
  const openrouter = getOpenRouter();
  const tools = options.tools ?? createCmsTools(options.cmsTools);

  const agent = new ToolLoopAgent({
    id: "wafercms-admin-task",
    model: openrouter(modelId),
    instructions: options.instructions ?? AGENT_SYSTEM_PROMPT,
    tools,
    stopWhen: isStepCount(limits.maxSteps),
    temperature: 0.2,
  });

  return { agent, modelId, limits, tools };
};

/**
 * Run a single admin task. Not a multi-turn chat — one prompt, tool loop, final text.
 * Streaming belongs in the run API (step 4).
 */
export const runAgent = async (
  input: AgentRunInput,
  options: CreateAgentOptions = {},
): Promise<AgentRunResult> => {
  const prompt = input.prompt?.trim();
  if (!prompt) {
    throw new Error("Provide a non-empty prompt.");
  }

  const { agent, modelId, limits } = createAgent(options);

  const result = await agent.generate({
    prompt,
    abortSignal: input.abortSignal,
    timeout: { totalMs: limits.totalTimeoutMs },
  });

  return {
    text: result.text,
    model: modelId,
    finishReason: result.finishReason,
    toolCalls: result.toolCalls.map((call) => ({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
    })),
    toolResults: result.toolResults.map((row) => ({
      toolCallId: row.toolCallId,
      toolName: row.toolName,
      output: row.output,
    })),
    usage: result.usage
      ? {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        }
      : undefined,
  };
};
