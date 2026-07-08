import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ListPagination } from "@/components/layout/list-pagination";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  useCollection,
  useCollectionFields,
  useCollectionItems,
  useDeleteCollectionItem,
} from "@/lib/queries";
import {
  type CollectionFieldRecord,
  type CollectionItemRecord,
} from "@/lib/cms-api";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const previewValue = (
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string => {
  const previewField = fields.find(
    (field) => field.fieldType === "text" || field.fieldType === "long-text",
  );
  if (!previewField) {
    return "";
  }
  const value = item.values[previewField.key];
  return typeof value === "string" ? value : "";
};

export default function CollectionItemsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const collectionId = Number(id);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const collectionQuery = useCollection(collectionId);
  const fieldsQuery = useCollectionFields(collectionId);
  const itemsQuery = useCollectionItems(collectionId, page);
  const deleteItem = useDeleteCollectionItem(collectionId);

  const record = collectionQuery.data ?? null;
  const fields = fieldsQuery.data ?? [];
  const items = itemsQuery.data?.data ?? [];
  const pagination = itemsQuery.data?.pagination ?? null;
  const loading =
    collectionQuery.isPending || fieldsQuery.isPending || itemsQuery.isPending;

  const queryError =
    !Number.isInteger(collectionId) || collectionId <= 0
      ? "Invalid collection id."
      : collectionQuery.error instanceof Error
        ? collectionQuery.error.message
        : fieldsQuery.error instanceof Error
          ? fieldsQuery.error.message
          : itemsQuery.error instanceof Error
            ? itemsQuery.error.message
            : collectionQuery.error || fieldsQuery.error || itemsQuery.error
              ? "Failed to load items"
              : null;

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: number,
  ) => {
    event.stopPropagation();
    setDeletingId(itemId);
    setError(null);
    try {
      await deleteItem.mutateAsync(itemId);
      const nextPage =
        items.length === 1 && pagination?.hasPrev ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      }
      toast.success("Item deleted.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to delete item";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header
        title={record ? `${record.title} · Items` : "Collection items"}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/collections/${collectionId}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/collections/${collectionId}/items/new`)}
            >
              <Plus className="mr-1 h-4 w-4" />
              New item
            </Button>
          </div>
        }
      />
      <PageContainer>
        {error || queryError ? (
          <p className="mb-4 text-sm text-destructive">{error ?? queryError}</p>
        ) : null}

        {!loading && fields.length > 0 ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Each item is one entry. Fetch them from your app with the collection
            slug and an API key.
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              This collection has no fields yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add fields before creating items.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate(`/collections/${collectionId}`)}
            >
              Go to collection
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No items yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const preview = previewValue(item, fields);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <button
                    onClick={() =>
                      navigate(`/collections/${collectionId}/items/${item.id}`)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-medium">
                      {preview || `Item #${item.id}`}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {fields.length} field
                      {fields.length === 1 ? "" : "s"} · updated{" "}
                      {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={(event) => void handleDelete(event, item.id)}
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {pagination ? (
          <ListPagination
            pagination={pagination}
            disabled={loading}
            onPageChange={setPage}
          />
        ) : null}
      </PageContainer>
    </>
  );
}
