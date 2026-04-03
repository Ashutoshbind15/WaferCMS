import { useNavigate } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { mockContent } from "@/lib/mock-data";

export default function ContentListPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Content"
        action={
          <Button onClick={() => navigate("/content/new")}>New Content</Button>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-2">
          {mockContent.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/content/${item.id}`)}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {item.preview}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                {item.updatedAt}
              </span>
            </button>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
