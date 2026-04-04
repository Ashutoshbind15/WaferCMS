import { lazy, Suspense } from "react";
import type { RichTextContent } from "@/components/editor/rich-text-document";
import { loadRichTextEditor } from "@/components/editor/rich-text-editor-loader";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const RichTextEditor = lazy(loadRichTextEditor);

function RichTextEditorFallback() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-[calc(100vh-20rem)] w-full" />
    </div>
  );
}

type ContentFormProps = {
  pageTitle: string;
  title: string;
  payload: RichTextContent;
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
  onPayloadChange: (value: RichTextContent) => void;
};

export function ContentForm({
  pageTitle,
  title,
  payload,
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
}: ContentFormProps) {
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
              placeholder="Content title..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-11 text-lg font-semibold"
            />

            <div className="rounded-lg border border-border bg-card">
              <Suspense fallback={<RichTextEditorFallback />}>
                <RichTextEditor
                  initialContent={payload}
                  isEditable={true}
                  onChange={onPayloadChange}
                />
              </Suspense>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
