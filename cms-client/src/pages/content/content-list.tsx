import { useState } from "react";
import { useNavigate } from "react-router";
import { ListPagination } from "@/components/layout/list-pagination";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useContentList, useDeleteContent } from "@/lib/queries";

export default function ContentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contentQuery = useContentList(page);
  const deleteContent = useDeleteContent();

  const items = contentQuery.data?.data ?? [];
  const pagination = contentQuery.data?.pagination ?? null;
  const loading = contentQuery.isPending;
  const queryError =
    contentQuery.error instanceof Error
      ? contentQuery.error.message
      : contentQuery.error
        ? "Failed to load content"
        : null;

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number,
  ) => {
    event.stopPropagation();
    setDeletingId(id);
    setError(null);
    try {
      await deleteContent.mutateAsync(id);
      const nextPage =
        items.length === 1 && pagination?.hasPrev ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header
        title="Content"
        action={
          <Button onClick={() => navigate("/content/new")}>New Content</Button>
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
              No content yet
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
                  onClick={() => navigate(`/content/${item.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    Updated {new Date(item.updatedAt).toLocaleString()}
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
