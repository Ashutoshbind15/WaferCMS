import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchDiagram, updateDiagram } from "@/lib/cms-api";
import { toast } from "sonner";
import { DiagramForm } from "../../components/forms/diagram-form";

const formatPayload = (payload: unknown) =>
  JSON.stringify(payload ?? {}, null, 2);

const EMPTY_PAYLOAD = formatPayload({});

const diagramSnapshot = (title: string, payloadText: string) =>
  JSON.stringify({ title, payloadText });

const EMPTY_DIAGRAM_SNAPSHOT = diagramSnapshot("", EMPTY_PAYLOAD);

export default function DiagramEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [payloadText, setPayloadText] = useState(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_DIAGRAM_SNAPSHOT);

  const dirty =
    !loading && diagramSnapshot(title, payloadText) !== savedSnapshot;
  const canClear = payloadText !== EMPTY_PAYLOAD;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await fetchDiagram(Number(id));
        if (!cancelled) {
          const nextPayloadText = formatPayload(existing.payload);
          setTitle(existing.title);
          setPayloadText(nextPayloadText);
          setSavedSnapshot(diagramSnapshot(existing.title, nextPayloadText));
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
      const updated = await updateDiagram(Number(id), {
        title,
        payload: parsedPayload,
      });
      const nextPayloadText = formatPayload(updated.payload);
      setTitle(updated.title);
      setPayloadText(nextPayloadText);
      setSavedSnapshot(diagramSnapshot(updated.title, nextPayloadText));
      toast.success("Diagram saved.");
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
      pageTitle="Edit Diagram"
      title={title}
      payloadText={payloadText}
      loading={loading}
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
