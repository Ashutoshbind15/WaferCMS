import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CollectionFieldsPanel } from "@/components/collections/collection-fields-panel";
import { CollectionMetadataDialog } from "@/components/collections/collection-metadata-dialog";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useCollection, useUpdateCollection } from "@/lib/queries";
import { ArrowLeft, List, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const collectionId = Number(id);

  const collectionQuery = useCollection(collectionId);
  const updateCollection = useUpdateCollection(collectionId);

  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const record = collectionQuery.data ?? null;
  const loading = collectionQuery.isPending;
  const error =
    !Number.isInteger(collectionId) || collectionId <= 0
      ? "Invalid collection id."
      : collectionQuery.error instanceof Error
        ? collectionQuery.error.message
        : collectionQuery.error
          ? "Failed to load collection"
          : null;

  const handleSaveMetadata = async (input: {
    slug: string;
    title: string;
    description: string;
  }) => {
    setMetadataError(null);
    try {
      await updateCollection.mutateAsync({
        slug: input.slug,
        title: input.title,
        description: input.description || null,
      });
      toast.success("Collection updated.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to save collection";
      setMetadataError(message);
      toast.error(message);
      throw e;
    }
  };

  return (
    <>
      <Header
        title={record?.title ?? "Collection"}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/collections")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !record}
              onClick={() => navigate(`/collections/${collectionId}/items`)}
            >
              <List className="mr-1 h-4 w-4" />
              Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !record}
              onClick={() => {
                setMetadataError(null);
                setMetadataOpen(true);
              }}
            >
              <Settings2 className="mr-1 h-4 w-4" />
              Settings
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
        ) : record ? (
          <div className="mx-auto max-w-3xl space-y-6">
            {record.description ? (
              <p className="text-sm text-muted-foreground">
                {record.description}
              </p>
            ) : null}

            <p className="text-sm text-muted-foreground">
              Set up fields here. When you&apos;re ready, add items from the{" "}
              <span className="font-medium text-foreground">Items</span> tab.
            </p>

            <CollectionFieldsPanel collectionId={collectionId} />
          </div>
        ) : null}
      </PageContainer>

      <CollectionMetadataDialog
        open={metadataOpen}
        record={record}
        saving={updateCollection.isPending}
        error={metadataError}
        onOpenChange={setMetadataOpen}
        onSave={handleSaveMetadata}
      />
    </>
  );
}
