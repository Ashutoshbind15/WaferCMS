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
  error: string | null;
  onBack: () => void;
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
  error,
  onBack,
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
            <Button disabled={saving || loading} onClick={() => void onSave()}>
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
