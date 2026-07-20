import type { Request, Response } from "express";
import { pipeUIMessageStreamToResponse, toUIMessageStream } from "ai";
import { createAgent } from "../lib/ai/agent/index.js";
import type { AiAgentRunBody } from "../lib/validation.js";

/**
 * Stream a single-turn admin task via the AI SDK UI message SSE protocol.
 * Body is `{ prompt }` only — no conversation state on the server.
 */
export const runAiAgent = async (req: Request, res: Response) => {
  if (!req.sessionAuth) {
    res.status(401).json({
      error: "AI agent requires an admin session. Sign in via the CMS UI.",
    });
    return;
  }

  const { prompt } = req.body as AiAgentRunBody;

  const abortController = new AbortController();
  const onClose = () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  };
  req.on("close", onClose);

  try {
    const { agent, limits, tools } = createAgent();
    const result = await agent.stream({
      prompt,
      abortSignal: abortController.signal,
      timeout: { totalMs: limits.totalTimeoutMs },
    });

    pipeUIMessageStreamToResponse({
      response: res,
      stream: toUIMessageStream({
        stream: result.stream,
        tools,
      }),
    });
  } catch (error) {
    req.off("close", onClose);

    if (abortController.signal.aborted || res.headersSent) {
      return;
    }

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    console.error("AI agent run failed:", error);

    if (message === "Provide a non-empty prompt.") {
      res.status(400).json({ error: message });
      return;
    }

    if (message.includes("OPENROUTER_API_KEY")) {
      res.status(503).json({ error: "AI provider is not configured." });
      return;
    }

    res.status(502).json({
      error: message.startsWith("Model ")
        ? message
        : "Failed to run the AI agent.",
    });
  }
};
