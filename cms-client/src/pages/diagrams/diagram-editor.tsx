import { useNavigate } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DiagramEditorPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Edit Diagram"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/diagrams")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button disabled>Save</Button>
          </div>
        }
      />
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-32 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Diagram editor placeholder
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The diagram canvas and tools will appear here.
          </p>
        </div>
      </PageContainer>
    </>
  );
}
