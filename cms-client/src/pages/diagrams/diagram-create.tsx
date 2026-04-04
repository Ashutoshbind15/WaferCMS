import { useState } from "react";
import { useNavigate } from "react-router";
import { createDiagram } from "@/lib/cms-api";
import { toast } from "sonner";
import { DiagramForm } from "../../components/forms/diagram-form";

const EMPTY_PAYLOAD = JSON.stringify({}, null, 2);

const diagramSnapshot = (title: string, payloadText: string) =>
  JSON.stringify({ title, payloadText });

const EMPTY_DIAGRAM_SNAPSHOT = diagramSnapshot("", EMPTY_PAYLOAD);

export default function DiagramCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payloadText, setPayloadText] = useState(EMPTY_PAYLOAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = diagramSnapshot(title, payloadText) !== EMPTY_DIAGRAM_SNAPSHOT;
  const canClear = payloadText !== EMPTY_PAYLOAD;

  const handleClear = () => {
    setError(null);
    setPayloadText(EMPTY_PAYLOAD);
  };

  const handleSave = async () => {
    let parsedPayload: unknown;

    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError("Diagram payload must be valid JSON.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createDiagram({ title, payload: parsedPayload });
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
      payloadText={payloadText}
      loading={false}
      saving={saving}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear payload"
      error={error}
      onBack={() => navigate("/diagrams")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayloadText}
    />
  );
}
