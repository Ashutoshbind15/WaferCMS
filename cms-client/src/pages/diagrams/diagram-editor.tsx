import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDiagram, useUpdateDiagram } from "@/lib/queries";
import { toast } from "sonner";
import { DiagramForm } from "../../components/forms/diagram-form";
import type { DiagramDocument } from "@scribblesvg/core";
import { EMPTY_DOCUMENT } from "@scribblesvg/core";
import { parsePayload, diagramSnapshot } from "./diagram-utils";

const EMPTY_SNAPSHOT = diagramSnapshot("", EMPTY_DOCUMENT);

export default function DiagramEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const diagramId = Number(id);

  const diagramQuery = useDiagram(diagramId);
  const updateDiagram = useUpdateDiagram(diagramId);

  const [title, setTitle] = useState("");
  const [document, setDocument] = useState<DiagramDocument>(EMPTY_DOCUMENT);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_SNAPSHOT);
  const [dirty, setDirty] = useState(false);

  const loading = diagramQuery.isPending;
  const canClear = document.elements.length > 0;

  useEffect(() => {
    if (!diagramQuery.data) {
      return;
    }

    let doc: DiagramDocument;
    try {
      doc = parsePayload(diagramQuery.data.payload);
    } catch {
      doc = EMPTY_DOCUMENT;
      setError(
        "Saved diagram payload could not be parsed. Starting with an empty canvas.",
      );
    }
    setTitle(diagramQuery.data.title);
    setDocument(doc);
    setSavedSnapshot(diagramSnapshot(diagramQuery.data.title, doc));
    setDirty(false);
  }, [diagramQuery.data]);

  useEffect(() => {
    if (loading) {
      return;
    }
    setDirty(diagramSnapshot(title, document) !== savedSnapshot);
  }, [loading, title, document, savedSnapshot]);

  const handleClear = () => {
    setError(null);
    setDocument(EMPTY_DOCUMENT);
  };

  const handleSave = async () => {
    setError(null);

    try {
      await updateDiagram.mutateAsync({
        title,
        payload: document,
      });

      setSavedSnapshot(diagramSnapshot(title, document));
      setDirty(false);
      toast.success("Diagram saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save diagram";
      setError(message);
      toast.error(message);
    }
  };

  const queryError =
    diagramQuery.error instanceof Error
      ? diagramQuery.error.message
      : diagramQuery.error
        ? "Failed to load diagram"
        : null;

  return (
    <DiagramForm
      pageTitle="Edit Diagram"
      title={title}
      document={document}
      loading={loading}
      saving={updateDiagram.isPending}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear canvas"
      error={error ?? queryError}
      onBack={() => navigate("/diagrams")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onDocumentChange={setDocument}
    />
  );
}
