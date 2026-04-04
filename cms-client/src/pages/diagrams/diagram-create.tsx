import { useState } from "react";
import { useNavigate } from "react-router";
import { createDiagram } from "@/lib/cms-api";
import { DiagramForm } from "../../components/forms/diagram-form";

const EMPTY_PAYLOAD = "{}\n";

export default function DiagramCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payloadText, setPayloadText] = useState(EMPTY_PAYLOAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      navigate(`/diagrams/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save diagram");
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
      error={error}
      onBack={() => navigate("/diagrams")}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayloadText}
    />
  );
}
