import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateDiagram, useUpdateDiagram } from "@/lib/queries";
import { DiagramCanvas } from "@scribblesvg/react-utils/editor";
import { EMPTY_DOCUMENT, type DiagramDocument } from "@scribblesvg/core";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { diagramSnapshot } from "@/pages/diagrams/diagram-utils";

type DiagramEditorProps = {
  pageTitle: string;
  initialTitle: string;
  initialDocument: DiagramDocument;
  diagramId?: number;
  warning?: string | null;
  onBack: () => void;
};

export function DiagramEditor(props: DiagramEditorProps) {
  if (props.diagramId != null) {
    return <DiagramEditorEdit {...props} diagramId={props.diagramId} />;
  }
  return <DiagramEditorCreate {...props} />;
}

type DiagramEditorBodyProps = Omit<DiagramEditorProps, "diagramId"> & {
  onSave: (input: {
    title: string;
    document: DiagramDocument;
  }) => Promise<void>;
  saving: boolean;
};

function DiagramEditorBody({
  pageTitle,
  initialTitle,
  initialDocument,
  warning,
  onBack,
  onSave,
  saving,
}: DiagramEditorBodyProps) {
  const [title, setTitle] = useState(initialTitle);
  const [document, setDocument] = useState(initialDocument);
  const [canvasKey, setCanvasKey] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    diagramSnapshot(initialTitle, initialDocument),
  );
  const [error, setError] = useState<string | null>(null);

  const dirty = diagramSnapshot(title, document) !== savedSnapshot;
  const canClear = document.elements.length > 0;

  const handleClear = () => {
    setError(null);
    setDocument(EMPTY_DOCUMENT);
    setCanvasKey((k) => k + 1);
  };

  const handleSave = async () => {
    setError(null);
    try {
      await onSave({ title, document });
      setSavedSnapshot(diagramSnapshot(title, document));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save diagram";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <Header
        title={pageTitle}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {dirty ? (
              <span
                className="inline-flex items-center"
                title="Unsaved changes"
              >
                <span className="sr-only">Unsaved changes</span>
                <span
                  aria-hidden
                  className="size-2.5 rounded-full bg-amber-500"
                />
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={saving || !canClear}
              onClick={handleClear}
              title="Clear canvas"
              aria-label="Clear canvas"
            >
              Clear
            </Button>
            <Button disabled={saving || !dirty} onClick={() => void handleSave()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />
      <PageContainer className="flex flex-1 flex-col overflow-hidden">
        {warning || error ? (
          <p className="mb-4 text-sm text-destructive">{warning ?? error}</p>
        ) : null}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="mb-3 px-1">
            <Input
              placeholder="Diagram title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-lg font-semibold"
            />
          </div>

          <div className="flex-1 overflow-hidden rounded-lg border border-border">
            <DiagramCanvas
              key={canvasKey}
              initialDocument={document}
              onChange={setDocument}
            />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function DiagramEditorCreate(props: Omit<DiagramEditorProps, "diagramId">) {
  const navigate = useNavigate();
  const createDiagram = useCreateDiagram();

  return (
    <DiagramEditorBody
      {...props}
      saving={createDiagram.isPending}
      onSave={async ({ title, document }) => {
        const created = await createDiagram.mutateAsync({
          title,
          payload: document,
        });
        toast.success("Diagram created.");
        navigate(`/diagrams/${created.id}`);
      }}
    />
  );
}

function DiagramEditorEdit({
  diagramId,
  ...props
}: Omit<DiagramEditorProps, "diagramId"> & { diagramId: number }) {
  const updateDiagram = useUpdateDiagram(diagramId);

  return (
    <DiagramEditorBody
      {...props}
      saving={updateDiagram.isPending}
      onSave={async ({ title, document }) => {
        await updateDiagram.mutateAsync({ title, payload: document });
        toast.success("Diagram saved.");
      }}
    />
  );
}
