/**
 * Client helpers for the admin task agent stream.
 * Uses the AI SDK UI-message SSE protocol (same as DefaultChatTransport).
 */

import {
  getToolName,
  isToolUIPart,
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

export type AiToolCallStatus = "pending" | "running" | "done" | "error";

export type AiToolCallState = {
  toolCallId: string;
  toolName: string;
  status: AiToolCallStatus;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export type AiRunStreamHandlers = {
  onMessage?: (message: UIMessage) => void;
  onText?: (text: string) => void;
  onToolCallsChange?: (toolCalls: AiToolCallState[]) => void;
  onError?: (message: string) => void;
};

export type AiRunStreamResult = {
  message: UIMessage | null;
  text: string;
  toolCalls: AiToolCallState[];
};

type ToolPart = ToolUIPart | DynamicToolUIPart;

export const textFromUIMessage = (message: UIMessage): string =>
  message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

const statusFromToolPart = (part: ToolPart): AiToolCallStatus => {
  switch (part.state) {
    case "input-streaming":
      return "pending";
    case "input-available":
    case "approval-requested":
    case "approval-responded":
      return "running";
    case "output-available":
      return "done";
    case "output-error":
    case "output-denied":
      return "error";
    default:
      return "pending";
  }
};

export const toolCallsFromUIMessage = (
  message: UIMessage,
): AiToolCallState[] =>
  message.parts.filter(isToolUIPart).map((part) => ({
    toolCallId: part.toolCallId,
    toolName: getToolName(part),
    status: statusFromToolPart(part),
    input: "input" in part ? part.input : undefined,
    output: part.state === "output-available" ? part.output : undefined,
    errorText:
      part.state === "output-error"
        ? part.errorText
        : part.state === "output-denied"
          ? (part.approval.reason ?? "Tool call denied.")
          : undefined,
  }));

export const parseUiMessageChunkStream = (
  stream: ReadableStream<Uint8Array>,
): ReadableStream<UIMessageChunk> =>
  parseJsonEventStream({
    stream,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (!chunk.success) {
          throw chunk.error;
        }
        controller.enqueue(chunk.value);
      },
    }),
  );

/**
 * Consume a UI-message SSE response via AI SDK helpers and fold into
 * text + tool-call view state for the task UI.
 */
export async function consumeAiUiMessageStream(
  response: Response,
  handlers: AiRunStreamHandlers = {},
  signal?: AbortSignal,
): Promise<AiRunStreamResult> {
  if (!response.body) {
    throw new Error("No response body.");
  }

  const onAbort = () => {
    void response.body?.cancel();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  let lastMessage: UIMessage | null = null;
  let text = "";
  let toolCalls: AiToolCallState[] = [];
  let streamError: string | null = null;

  try {
    const chunkStream = parseUiMessageChunkStream(response.body);

    for await (const message of readUIMessageStream({
      stream: chunkStream,
      onError: (error) => {
        const messageText =
          error instanceof Error ? error.message : "Agent stream error.";
        streamError = messageText;
        handlers.onError?.(messageText);
      },
      terminateOnError: true,
    })) {
      if (signal?.aborted) {
        break;
      }

      lastMessage = message;
      text = textFromUIMessage(message);
      toolCalls = toolCallsFromUIMessage(message);

      handlers.onMessage?.(message);
      handlers.onText?.(text);
      handlers.onToolCallsChange?.(toolCalls);
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (streamError && !text && toolCalls.length === 0) {
    throw new Error(streamError);
  }

  return {
    message: lastMessage,
    text,
    toolCalls,
  };
}
