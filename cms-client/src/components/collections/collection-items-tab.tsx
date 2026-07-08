import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CollectionItemsBrowseView } from "@/components/collections/collection-items-browse-view";
import { itemDisplayTitle } from "@/components/collections/collection-item-utils";
import { ListPagination } from "@/components/layout/list-pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCollectionFields,
  useCollectionItems,
  useDeleteCollectionItem,
} from "@/lib/queries";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Mode = "list" | "browse";

type CollectionItemsTabProps = {
  collectionId: number;
  onGoToFields: () => void;
};

export function CollectionItemsTab({
  collectionId,
  onGoToFields,
}: CollectionItemsTabProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>("browse");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fieldsQuery = useCollectionFields(collectionId);
  const itemsQuery = useCollectionItems(collectionId, page);
  const deleteItem = useDeleteCollectionItem(collectionId);

  const fields = fieldsQuery.data ?? [];
  const items = itemsQuery.data?.data ?? [];
  const pagination = itemsQuery.data?.pagination ?? null;
  const loading = fieldsQuery.isPending || itemsQuery.isPending;

  const queryError =
    !Number.isInteger(collectionId) || collectionId <= 0
      ? "Invalid collection id."
      : fieldsQuery.error instanceof Error
        ? fieldsQuery.error.message
        : itemsQuery.error instanceof Error
          ? itemsQuery.error.message
          : fieldsQuery.error || itemsQuery.error
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

  const goNew = () => navigate(`/collections/${collectionId}/items/new`);

  if (fields.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          This collection has no fields yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add fields before creating items.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onGoToFields}>
          Go to fields
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error || queryError ? (
        <p className="text-sm text-destructive">{error ?? queryError}</p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="browse">Browse</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={goNew}>
          <Plus className="mr-1 h-4 w-4" />
          New item
        </Button>
      </div>

      {mode === "browse" ? (
        <CollectionItemsBrowseView
          collectionId={collectionId}
          fields={fields}
          onEdit={(itemId) =>
            navigate(`/collections/${collectionId}/items/${itemId}`)
          }
          onNewItem={goNew}
        />
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No items yet
          </p>
          <Button size="sm" className="mt-4" onClick={goNew}>
            New item
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const title = itemDisplayTitle(item, fields);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-accent/40"
              >
                <button
                  onClick={() =>
                    navigate(`/collections/${collectionId}/items/${item.id}`)
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
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

      {mode === "list" && pagination ? (
        <ListPagination
          pagination={pagination}
          disabled={loading}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
