import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiagramCanvas } from "@/components/diagram-canvas";
import type { DiagramDocument } from "@packages/diagram";
import { ArrowLeft } from "lucide-react";

type DiagramFormProps = {
  pageTitle: string;
  title: string;
  document: DiagramDocument;
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
  onDocumentChange: (doc: DiagramDocument) => void;
};

export function DiagramForm({
  pageTitle,
  title,
  document,
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
  onDocumentChange,
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
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />
      <PageContainer className="flex flex-1 flex-col overflow-hidden">
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-3 px-1">
              <Input
                placeholder="Diagram title..."
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="h-11 text-lg font-semibold"
              />
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border border-border">
              <DiagramCanvas
                initialDocument={document}
                onChange={onDocumentChange}
              />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
