import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { deleteBlog, fetchBlogList, type BlogListRecord } from "@/lib/cms-api";

export default function BlogsListPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBlogList();
        if (!cancelled) {
          setBlogs(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load blogs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number,
  ) => {
    event.stopPropagation();
    setDeletingId(id);
    setError(null);
    try {
      await deleteBlog(id);
      setBlogs((prev) => prev.filter((blog) => blog.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header
        title="Blogs"
        action={
          <Button onClick={() => navigate("/blogs/new")}>New Blog</Button>
        }
      />
      <PageContainer>
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No blogs yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <button
                  onClick={() => navigate(`/blogs/${blog.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium">{blog.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {blog.blocks.length} block
                    {blog.blocks.length === 1 ? "" : "s"}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === blog.id}
                  onClick={(event) => {
                    void handleDelete(event, blog.id);
                  }}
                >
                  {deletingId === blog.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
