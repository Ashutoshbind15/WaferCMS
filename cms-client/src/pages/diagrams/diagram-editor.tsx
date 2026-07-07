import { useNavigate, useParams } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/lib/queries";
import { DiagramEditor } from "../../components/forms/diagram-form";
import { EMPTY_DOCUMENT } from "@scribblesvg/core";
import { ArrowLeft } from "lucide-react";
import { parsePayload } from "./diagram-utils";

export default function DiagramEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const diagramId = Number(id);

  const diagramQuery = useDiagram(diagramId);

  const queryError =
    diagramQuery.error instanceof Error
      ? diagramQuery.error.message
      : diagramQuery.error
        ? "Failed to load diagram"
        : null;

  if (diagramQuery.isPending) {
    return (
      <>
        <Header
          title="Edit Diagram"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/diagrams")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          }
        />
        <PageContainer>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </PageContainer>
      </>
    );
  }

  if (queryError || !diagramQuery.data) {
    return (
      <>
        <Header
          title="Edit Diagram"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/diagrams")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          }
        />
        <PageContainer>
          <p className="text-sm text-destructive">{queryError ?? "Failed to load diagram"}</p>
        </PageContainer>
      </>
    );
  }

  let initialDocument = EMPTY_DOCUMENT;
  let warning: string | null = null;
  try {
    initialDocument = parsePayload(diagramQuery.data.payload);
  } catch {
    warning =
      "Saved diagram payload could not be parsed. Starting with an empty canvas.";
  }

  return (
    <DiagramEditor
      key={diagramId}
      pageTitle="Edit Diagram"
      diagramId={diagramId}
      initialTitle={diagramQuery.data.title}
      initialDocument={initialDocument}
      warning={warning}
      onBack={() => navigate("/diagrams")}
    />
  );
}
