import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { fetchContent, updateContent } from "@/lib/cms-api";
import { toast } from "sonner";
import { ContentForm } from "../../components/forms/content-form";

const contentSnapshot = (title: string, payload: RichTextContent) =>
  JSON.stringify({ title, payload });

const EMPTY_CONTENT_PAYLOAD_SNAPSHOT = JSON.stringify(EMPTY_EDITOR_DOC);
const EMPTY_CONTENT_SNAPSHOT = contentSnapshot("", EMPTY_EDITOR_DOC);

export default function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<RichTextContent>(EMPTY_EDITOR_DOC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_CONTENT_SNAPSHOT);

  const dirty = !loading && contentSnapshot(title, payload) !== savedSnapshot;
  const canClear = JSON.stringify(payload) !== EMPTY_CONTENT_PAYLOAD_SNAPSHOT;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await fetchContent(Number(id));
        if (!cancelled) {
          const nextPayload =
            (existing.payload as RichTextContent) ?? EMPTY_EDITOR_DOC;
          setTitle(existing.title);
          setPayload(nextPayload);
          setSavedSnapshot(contentSnapshot(existing.title, nextPayload));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load content");
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
    setPayload(EMPTY_EDITOR_DOC);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateContent(Number(id), { title, payload });
      const nextPayload =
        (updated.payload as RichTextContent) ?? EMPTY_EDITOR_DOC;
      setTitle(updated.title);
      setPayload(nextPayload);
      setSavedSnapshot(contentSnapshot(updated.title, nextPayload));
      toast.success("Content saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save content";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentForm
      pageTitle="Edit Content"
      title={title}
      payload={payload}
      loading={loading}
      saving={saving}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear content"
      error={error}
      onBack={() => navigate("/content")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayload}
    />
  );
}
