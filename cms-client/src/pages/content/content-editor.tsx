import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { fetchContent, updateContent } from "@/lib/cms-api";
import { ContentForm } from "../../components/forms/content-form";

export default function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<RichTextContent>(EMPTY_EDITOR_DOC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await fetchContent(Number(id));
        if (!cancelled) {
          setTitle(existing.title);
          setPayload((existing.payload as RichTextContent) ?? EMPTY_EDITOR_DOC);
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateContent(Number(id), { title, payload });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save content");
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
      error={error}
      onBack={() => navigate("/content")}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayload}
    />
  );
}
