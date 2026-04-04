import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchDiagram, updateDiagram } from "@/lib/cms-api";
import { DiagramForm } from "../../components/forms/diagram-form";

const formatPayload = (payload: unknown) =>
  JSON.stringify(payload ?? {}, null, 2);

export default function DiagramEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [payloadText, setPayloadText] = useState("{}\n");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await fetchDiagram(Number(id));
        if (!cancelled) {
          setTitle(existing.title);
          setPayloadText(formatPayload(existing.payload));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load diagram");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      await updateDiagram(Number(id), { title, payload: parsedPayload });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save diagram");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DiagramForm
      pageTitle="Edit Diagram"
      title={title}
      payloadText={payloadText}
      loading={loading}
      saving={saving}
      error={error}
      onBack={() => navigate("/diagrams")}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayloadText}
    />
  );
}
