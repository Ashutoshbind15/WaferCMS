import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { useContent, useUpdateContent } from "@/lib/queries";
import { toast } from "sonner";
import { ContentForm } from "../../components/forms/content-form";

const contentSnapshot = (title: string, payload: RichTextContent) =>
  JSON.stringify({ title, payload });

const EMPTY_CONTENT_PAYLOAD_SNAPSHOT = JSON.stringify(EMPTY_EDITOR_DOC);
const EMPTY_CONTENT_SNAPSHOT = contentSnapshot("", EMPTY_EDITOR_DOC);

export default function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentId = Number(id);

  const contentQuery = useContent(contentId);
  const updateContent = useUpdateContent(contentId);

  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<RichTextContent>(EMPTY_EDITOR_DOC);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_CONTENT_SNAPSHOT);
  const [dirty, setDirty] = useState(false);

  const loading = contentQuery.isPending;
  const canClear = JSON.stringify(payload) !== EMPTY_CONTENT_PAYLOAD_SNAPSHOT;

  useEffect(() => {
    if (!contentQuery.data) {
      return;
    }

    const nextPayload =
      (contentQuery.data.payload as RichTextContent) ?? EMPTY_EDITOR_DOC;
    setTitle(contentQuery.data.title);
    setPayload(nextPayload);
    setSavedSnapshot(contentSnapshot(contentQuery.data.title, nextPayload));
    setDirty(false);
  }, [contentQuery.data]);

  useEffect(() => {
    if (loading) {
      return;
    }
    setDirty(contentSnapshot(title, payload) !== savedSnapshot);
  }, [loading, title, payload, savedSnapshot]);

  const handleClear = () => {
    setError(null);
    setPayload(EMPTY_EDITOR_DOC);
  };

  const handleSave = async () => {
    setError(null);
    try {
      await updateContent.mutateAsync({ title, payload });
      setSavedSnapshot(contentSnapshot(title, payload));
      setDirty(false);
      toast.success("Content saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save content";
      setError(message);
      toast.error(message);
    }
  };

  const queryError =
    contentQuery.error instanceof Error
      ? contentQuery.error.message
      : contentQuery.error
        ? "Failed to load content"
        : null;

  return (
    <ContentForm
      pageTitle="Edit Content"
      title={title}
      payload={payload}
      loading={loading}
      saving={updateContent.isPending}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear content"
      error={error ?? queryError}
      onBack={() => navigate("/content")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onPayloadChange={setPayload}
    />
  );
}
