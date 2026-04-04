import { useState } from "react";
import { useNavigate } from "react-router";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { createContent } from "@/lib/cms-api";
import { ContentForm } from "../../components/forms/content-form";

export default function ContentCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<RichTextContent>(EMPTY_EDITOR_DOC);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const created = await createContent({ title, payload });
      navigate(`/content/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save content");
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
      error={error}
      onBack={() => navigate("/content")}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayload}
    />
  );
}
