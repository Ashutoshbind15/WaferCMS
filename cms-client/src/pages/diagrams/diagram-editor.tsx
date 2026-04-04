import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchDiagram, updateDiagram } from "@/lib/cms-api";
import { toast } from "sonner";
import { DiagramForm } from "../../components/forms/diagram-form";
import type { DiagramDocument } from "@packages/diagram";
import { EMPTY_DOCUMENT } from "@packages/diagram";
import { parsePayload, diagramSnapshot } from "./diagram-utils";

const EMPTY_SNAPSHOT = diagramSnapshot("", EMPTY_DOCUMENT);

export default function DiagramEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [document, setDocument] = useState<DiagramDocument>(EMPTY_DOCUMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_SNAPSHOT);

  const dirty = !loading && diagramSnapshot(title, document) !== savedSnapshot;
  const canClear = document.elements.length > 0;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await fetchDiagram(Number(id));
        if (!cancelled) {
          let doc: DiagramDocument;
          try {
            doc = parsePayload(existing.payload);
          } catch {
            // Corrupt/legacy data — fall back to empty and warn
            doc = EMPTY_DOCUMENT;
            setError(
              "Saved diagram payload could not be parsed. Starting with an empty canvas.",
            );
          }
          setTitle(existing.title);
          setDocument(doc);
          setSavedSnapshot(diagramSnapshot(existing.title, doc));
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
    setDocument(EMPTY_DOCUMENT);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateDiagram(Number(id), {
        title,
        payload: document,
      });

      // Re-parse the returned payload for the saved snapshot
      let savedDoc: DiagramDocument;
      try {
        savedDoc = parsePayload(updated.payload);
      } catch {
        savedDoc = document;
      }

      setTitle(updated.title);
      setDocument(savedDoc);
      setSavedSnapshot(diagramSnapshot(updated.title, savedDoc));
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
      document={document}
      loading={loading}
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
