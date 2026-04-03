import { useNavigate } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { mockBlogs } from "@/lib/mock-data";

export default function BlogsListPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Blogs"
        action={
          <Button onClick={() => navigate("/blogs/new")}>New Blog</Button>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-2">
          {mockBlogs.map((blog) => (
            <button
              key={blog.id}
              onClick={() => navigate(`/blogs/${blog.id}`)}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{blog.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {blog.summary}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                {blog.updatedAt}
              </span>
            </button>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
