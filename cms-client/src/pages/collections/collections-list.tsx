import { useState } from "react";
import { useNavigate } from "react-router";
import { ListPagination } from "@/components/layout/list-pagination";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useCollectionList, useDeleteCollection } from "@/lib/queries";

export default function CollectionsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const collectionsQuery = useCollectionList(page);
  const deleteCollection = useDeleteCollection();

  const items = collectionsQuery.data?.data ?? [];
  const pagination = collectionsQuery.data?.pagination ?? null;
  const loading = collectionsQuery.isPending;
  const queryError =
    collectionsQuery.error instanceof Error
      ? collectionsQuery.error.message
      : collectionsQuery.error
        ? "Failed to load collections"
        : null;

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number,
  ) => {
    event.stopPropagation();
    setDeletingId(id);
    setError(null);
    try {
      await deleteCollection.mutateAsync(id);
      const nextPage =
        items.length === 1 && pagination?.hasPrev ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to delete collection",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header
        title="Collections"
        action={
          <Button onClick={() => navigate("/collections/new")}>
            New collection
          </Button>
        }
      />
      <PageContainer>
        {error || queryError ? (
          <p className="mb-4 text-sm text-destructive">{error ?? queryError}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No collections yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <button
                  onClick={() => navigate(`/collections/${item.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    <span className="font-mono">{item.slug}</span>
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === item.id}
                  onClick={(event) => {
                    void handleDelete(event, item.id);
                  }}
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ))}
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
