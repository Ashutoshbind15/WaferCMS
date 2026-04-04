import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

type DiagramFormProps = {
  pageTitle: string;
  title: string;
  payloadText: string;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  canClear: boolean;
  clearActionLabel: string;
  error: string | null;
  onBack: () => void;
  onClear: () => void;
  onSave: () => Promise<void> | void;
  onTitleChange: (value: string) => void;
  onPayloadChange: (value: string) => void;
};

export function DiagramForm({
  pageTitle,
  title,
  payloadText,
  loading,
  saving,
  dirty,
  canClear,
  clearActionLabel,
  error,
  onBack,
  onClear,
  onSave,
  onTitleChange,
  onPayloadChange,
}: DiagramFormProps) {
  return (
    <>
      <Header
        title={pageTitle}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {dirty ? (
              <span
                className="inline-flex items-center"
                title="Unsaved changes"
              >
                <span className="sr-only">Unsaved changes</span>
                <span
                  aria-hidden
                  className="size-2.5 rounded-full bg-amber-500"
                />
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={saving || loading || !canClear}
              onClick={onClear}
              title={clearActionLabel}
              aria-label={clearActionLabel}
            >
              Clear
            </Button>
            <Button
              disabled={saving || loading || !dirty}
              onClick={() => void onSave()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />
      <PageContainer>
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <Input
              placeholder="Diagram title..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-11 text-lg font-semibold"
            />

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium">Payload</p>
              <Textarea
                value={payloadText}
                onChange={(e) => onPayloadChange(e.target.value)}
                className="min-h-[26rem] font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
