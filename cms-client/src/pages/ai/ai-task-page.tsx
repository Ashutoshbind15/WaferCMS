import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Loader2, Sparkles, Square } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { startAiAgentRun } from "@/lib/cms-api";
import {
  consumeAiUiMessageStream,
  type AiToolCallState,
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

function ToolCallChip({ call }: { call: AiToolCallState }) {
  const [open, setOpen] = useState(false);
  const statusLabel =
    call.status === "pending"
      ? "preparing"
      : call.status === "running"
        ? "running"
        : call.status === "error"
          ? "error"
          : "done";

  return (
    <div className="rounded-md border border-border bg-muted/30 text-sm">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="font-mono text-xs font-medium">{call.toolName}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            call.status === "error"
              ? "bg-destructive/15 text-destructive"
              : call.status === "done"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
          )}
        >
          {statusLabel}
        </span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border px-3 py-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Arguments
            </p>
            <pre className="max-h-48 overflow-auto rounded bg-background p-2 font-mono text-xs whitespace-pre-wrap">
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
              <pre className="max-h-64 overflow-auto rounded bg-background p-2 font-mono text-xs whitespace-pre-wrap">
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
      <PageContainer className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            One prompt, one run. The agent uses CMS tools and returns a result —
            not a chat thread.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={promptId}>Task</Label>
            <Textarea
              id={promptId}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. List collections and summarize their fields"
              rows={4}
              disabled={running}
              className="min-h-24 resize-y"
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

        {!hasRun && !running ? (
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Example tasks
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {EXAMPLE_TASKS.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start whitespace-normal px-3 py-2 text-left"
                  onClick={() => void run(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {hasRun ? (
          <>
            <Separator />

            {error ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}

            {toolCalls.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-medium">Tool calls</h2>
                <div className="space-y-2">
                  {toolCalls.map((call) => (
                    <ToolCallChip key={call.toolCallId} call={call} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <h2 className="text-sm font-medium">Result</h2>
              {resultText ? (
                <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm whitespace-pre-wrap">
                  {resultText}
                </div>
              ) : running ? (
                <p className="text-sm text-muted-foreground">Waiting for output…</p>
              ) : (
                <p className="text-sm text-muted-foreground">No text result.</p>
              )}
            </section>
          </>
        ) : null}
      </PageContainer>
    </>
  );
}
