import { useState } from "react";
import { useNavigate } from "react-router";
import { createDiagram } from "@/lib/cms-api";
import { toast } from "sonner";
import { DiagramForm } from "../../components/forms/diagram-form";
import type { DiagramDocument } from "@packages/diagram";
import { EMPTY_DOCUMENT } from "@packages/diagram";
import { diagramSnapshot } from "./diagram-utils";

const EMPTY_SNAPSHOT = diagramSnapshot("", EMPTY_DOCUMENT);

export default function DiagramCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [document, setDocument] = useState<DiagramDocument>(EMPTY_DOCUMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = diagramSnapshot(title, document) !== EMPTY_SNAPSHOT;
  const canClear = document.elements.length > 0;

  const handleClear = () => {
    setError(null);
    setDocument(EMPTY_DOCUMENT);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const created = await createDiagram({ title, payload: document });
      toast.success("Diagram created.");
      navigate(`/diagrams/${created.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save diagram";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DiagramForm
      pageTitle="New Diagram"
      title={title}
      document={document}
      loading={false}
      saving={saving}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear canvas"
      error={error}
      onBack={() => navigate("/diagrams")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onDocumentChange={setDocument}
    />
  );
}
