import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Sparkles,
  Square,
  Wrench,
} from "lucide-react";
import { Markdown } from "@/components/ai/markdown";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Textarea } from "@/components/ui/textarea";
import { startAiAgentRun } from "@/lib/cms-api";
import {
  consumeAiUiMessageStream,
  type AiToolCallState,
  type AiToolCallStatus,
} from "@/lib/ai-run-stream";
import { cn } from "@/lib/utils";

const EXAMPLE_TASKS = [
  "List all collections",
  "What fields does posts have?",
  "Draft an outline for a post about local coffee shops using research",
] as const;

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function attachmentStateFromToolStatus(
  status: AiToolCallStatus,
): "idle" | "uploading" | "processing" | "error" | "done" {
  switch (status) {
    case "pending":
      return "idle";
    case "running":
      return "processing";
    case "error":
      return "error";
    case "done":
      return "done";
  }
}

function toolStatusLabel(status: AiToolCallStatus): string {
  switch (status) {
    case "pending":
      return "Preparing";
    case "running":
      return "Running";
    case "error":
      return "Error";
    case "done":
      return "Done";
  }
}

function ToolCallAttachment({ call }: { call: AiToolCallState }) {
  const [open, setOpen] = useState(false);
  const state = attachmentStateFromToolStatus(call.status);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Attachment state={state} size="sm" className="w-full max-w-full">
        <AttachmentTrigger
          type="button"
          aria-expanded={open}
          aria-label={`Toggle ${call.toolName} details`}
          onClick={() => setOpen((value) => !value)}
        />
        <AttachmentMedia variant="icon">
          <Wrench />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle className="font-mono text-xs">
            {call.toolName}
          </AttachmentTitle>
          <AttachmentDescription>
            {toolStatusLabel(call.status)}
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction
            type="button"
            title={open ? "Hide details" : "Show details"}
            aria-label={open ? "Hide details" : "Show details"}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              className={cn("transition-transform", open && "rotate-180")}
            />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      {open ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Arguments
            </p>
            <pre className="max-h-48 overflow-auto rounded-md bg-background p-2 font-mono text-xs whitespace-pre-wrap">
              {call.input !== undefined ? formatJson(call.input) : "—"}
            </pre>
          </div>
          {call.errorText ? (
            <div>
              <p className="mb-1 text-xs font-medium text-destructive">Error</p>
              <p className="text-xs text-destructive">{call.errorText}</p>
            </div>
          ) : null}
          {call.output !== undefined ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Result
              </p>
              <pre className="max-h-64 overflow-auto rounded-md bg-background p-2 font-mono text-xs whitespace-pre-wrap">
                {formatJson(call.output)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AiTaskPage() {
  const promptId = useId();
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [resultText, setResultText] = useState("");
  const [toolCalls, setToolCalls] = useState<AiToolCallState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const canRun = prompt.trim().length > 0 && !running;
  const showEmptyState = !hasRun && !running;

  const resetRunState = () => {
    setResultText("");
    setToolCalls([]);
    setError(null);
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const run = async (taskPrompt: string) => {
    const trimmed = taskPrompt.trim();
    if (!trimmed || running) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPrompt(trimmed);
    setRunning(true);
    setHasRun(true);
    resetRunState();

    try {
      const response = await startAiAgentRun(
        { prompt: trimmed },
        { signal: controller.signal },
      );

      const result = await consumeAiUiMessageStream(
        response,
        {
          onText: setResultText,
          onToolCallsChange: setToolCalls,
          onError: (message) => setError(message),
        },
        controller.signal,
      );

      setResultText(result.text);
      setToolCalls(result.toolCalls);
    } catch (e) {
      if (controller.signal.aborted) {
        setError("Run cancelled.");
      } else {
        const message =
          e instanceof Error ? e.message : "Failed to run AI task";
        setError(message);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setRunning(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void run(prompt);
  };

  return (
    <>
      <Header title="AI tasks" />
      <PageContainer>
        {showEmptyState ? (
          <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <div className="w-full max-w-xl space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-medium tracking-tight">
                  What should we do?
                </h2>
                <p className="text-sm text-muted-foreground">
                  One prompt, one run. The agent uses CMS tools and returns a
                  result — not a chat thread.
                </p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/20 p-2 shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <Textarea
                    id={promptId}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (canRun) {
                          void run(prompt);
                        }
                      }
                    }}
                    placeholder="Ask about collections, draft content, or run a CMS task…"
                    rows={1}
                    disabled={running}
                    aria-label="Task"
                    className="min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
                  />
                  <Button
                    type="submit"
                    disabled={!canRun}
                    size="icon"
                    className="mb-0.5 size-9 shrink-0"
                    aria-label="Run"
                  >
                    <Sparkles />
                  </Button>
                </div>
              </form>

              <div className="grid gap-2">
                {EXAMPLE_TASKS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    onClick={() => void run(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mb-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor={promptId}>Task</Label>
                <Textarea
                  id={promptId}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="e.g. List collections and summarize their fields"
                  rows={3}
                  disabled={running}
                  className="min-h-20 resize-y"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {running ? (
                  <Button type="button" variant="outline" onClick={stop}>
                    <Square className="size-3.5" />
                    Stop
                  </Button>
                ) : (
                  <Button type="submit" disabled={!canRun}>
                    <Sparkles />
                    Run
                  </Button>
                )}
                {running ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Running…
                  </span>
                ) : null}
              </div>
            </form>

            <div className="space-y-4">
              <Marker variant="separator">
                <MarkerContent>Run</MarkerContent>
              </Marker>

              {error ? (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              {running && toolCalls.length === 0 && !resultText ? (
                <Marker>
                  <MarkerIcon>
                    <Loader2 className="animate-spin" />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">
                    Agent is working…
                  </MarkerContent>
                </Marker>
              ) : null}

              {toolCalls.length > 0 ? (
                <section className="space-y-3">
                  <Marker variant="separator">
                    <MarkerContent>Tool calls</MarkerContent>
                  </Marker>
                  <AttachmentGroup className="flex-col snap-none overflow-visible py-0">
                    {toolCalls.map((call) => (
                      <ToolCallAttachment
                        key={call.toolCallId}
                        call={call}
                      />
                    ))}
                  </AttachmentGroup>
                </section>
              ) : null}

              <section className="space-y-3">
                <Marker variant="separator">
                  <MarkerContent>Result</MarkerContent>
                </Marker>
                {resultText ? (
                  <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
                    <Markdown isAnimating={running}>{resultText}</Markdown>
                  </div>
                ) : running ? (
                  <p className="text-sm text-muted-foreground shimmer">
                    Waiting for output…
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No text result.</p>
                )}
              </section>
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
