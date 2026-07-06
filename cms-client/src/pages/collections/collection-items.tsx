import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ListPagination } from "@/components/layout/list-pagination";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  deleteCollectionItem,
  fetchCollection,
  fetchCollectionFields,
  fetchCollectionItems,
  type CollectionFieldRecord,
  type CollectionItemRecord,
  type CollectionRecord,
  type PagePagination,
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

  const [record, setRecord] = useState<CollectionRecord | null>(null);
  const [fields, setFields] = useState<CollectionFieldRecord[]>([]);
  const [items, setItems] = useState<CollectionItemRecord[]>([]);
  const [pagination, setPagination] = useState<PagePagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(
    async (targetPage: number) => {
      if (!Number.isInteger(collectionId) || collectionId <= 0) {
        setError("Invalid collection id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [collection, nextFields, result] = await Promise.all([
          fetchCollection(collectionId),
          fetchCollectionFields(collectionId),
          fetchCollectionItems(collectionId, { page: targetPage, count: true }),
        ]);
        setRecord(collection);
        setFields(nextFields);
        setItems(result.data);
        setPagination(result.pagination);
        setPage(result.pagination.page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load items");
      } finally {
        setLoading(false);
      }
    },
    [collectionId],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: number,
  ) => {
    event.stopPropagation();
    setDeletingId(itemId);
    setError(null);
    try {
      await deleteCollectionItem(collectionId, itemId);
      const nextPage =
        items.length === 1 && pagination?.hasPrev ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await load(page);
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
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
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
                      navigate(
                        `/collections/${collectionId}/items/${item.id}`,
                      )
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
