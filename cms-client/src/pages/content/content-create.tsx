import { useState } from "react";
import { useNavigate } from "react-router";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { createContent } from "@/lib/cms-api";
import { toast } from "sonner";
import { ContentForm } from "../../components/forms/content-form";

const contentSnapshot = (title: string, payload: RichTextContent) =>
  JSON.stringify({ title, payload });

const EMPTY_CONTENT_PAYLOAD_SNAPSHOT = JSON.stringify(EMPTY_EDITOR_DOC);
const EMPTY_CONTENT_SNAPSHOT = contentSnapshot("", EMPTY_EDITOR_DOC);

export default function ContentCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<RichTextContent>(EMPTY_EDITOR_DOC);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = contentSnapshot(title, payload) !== EMPTY_CONTENT_SNAPSHOT;
  const canClear = JSON.stringify(payload) !== EMPTY_CONTENT_PAYLOAD_SNAPSHOT;

  const handleClear = () => {
    setError(null);
    setPayload(EMPTY_EDITOR_DOC);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const created = await createContent({ title, payload });
      toast.success("Content created.");
      navigate(`/content/${created.id}`);
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
      pageTitle="New Content"
      title={title}
      payload={payload}
      loading={false}
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
