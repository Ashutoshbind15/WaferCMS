import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockContent } from "@/lib/mock-data";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { ArrowLeft } from "lucide-react";

export default function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const existing = mockContent.find((c) => c.id === id);
  const [title, setTitle] = useState(existing?.title ?? "");

  return (
    <>
      <Header
        title="Edit Content"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/content")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                console.log("Save content", { id, title });
              }}
            >
              Save
            </Button>
          </div>
        }
      />
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-4">
          <Input
            placeholder="Content title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold h-11"
          />

          <div className="rounded-lg border border-border bg-card">
            <RichTextEditor content={existing?.body ?? ""} isEditable={true} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
