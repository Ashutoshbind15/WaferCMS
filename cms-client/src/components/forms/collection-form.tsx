import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CollectionMetadataFields } from "./collection-metadata-fields";

type CollectionFormProps = {
  pageTitle: string;
  slug: string;
  title: string;
  description: string;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
  onBack: () => void;
  onSave: () => Promise<void> | void;
  onSlugChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function CollectionForm({
  pageTitle,
  slug,
  title,
  description,
  loading,
  saving,
  dirty,
  error,
  onBack,
  onSave,
  onSlugChange,
  onTitleChange,
  onDescriptionChange,
}: CollectionFormProps) {
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
              <span className="inline-flex items-center" title="Unsaved changes">
                <span className="sr-only">Unsaved changes</span>
                <span
                  aria-hidden
                  className="size-2.5 rounded-full bg-amber-500"
                />
              </span>
            ) : null}
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
          <div className="mx-auto max-w-2xl">
            <CollectionMetadataFields
              slug={slug}
              title={title}
              description={description}
              onSlugChange={onSlugChange}
              onTitleChange={onTitleChange}
              onDescriptionChange={onDescriptionChange}
            />
          </div>
        )}
      </PageContainer>
    </>
  );
}
