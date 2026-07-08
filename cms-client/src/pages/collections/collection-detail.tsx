import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { CollectionFieldsPanel } from "@/components/collections/collection-fields-panel";
import { CollectionItemsTab } from "@/components/collections/collection-items-tab";
import { CollectionMetadataDialog } from "@/components/collections/collection-metadata-dialog";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useUpdateCollection } from "@/lib/queries";
import { ArrowLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";

type Tab = "fields" | "items";

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const collectionId = Number(id);

  const collectionQuery = useCollection(collectionId);
  const updateCollection = useUpdateCollection(collectionId);

  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const fromState = (location.state as { tab?: Tab } | null)?.tab;
    return fromState === "items" ? "items" : "fields";
  });

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
          <div
            className={`mx-auto space-y-6 ${tab === "items" ? "max-w-7xl" : "max-w-5xl"}`}
          >
            {record.description ? (
              <p className="text-sm text-muted-foreground">
                {record.description}
              </p>
            ) : null}

            <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
              <TabsList>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="mt-6">
                <CollectionFieldsPanel collectionId={collectionId} />
              </TabsContent>

              <TabsContent value="items" className="mt-6">
                <CollectionItemsTab
                  collectionId={collectionId}
                  onGoToFields={() => setTab("fields")}
                />
              </TabsContent>
            </Tabs>
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
