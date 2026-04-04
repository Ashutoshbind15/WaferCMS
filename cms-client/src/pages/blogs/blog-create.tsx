import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  createBlog,
  fetchContentList,
  fetchDiagramList,
  type BlogBlockReference,
  type ContentRecord,
  type DiagramRecord,
} from "@/lib/cms-api";
import { toast } from "sonner";
import {
  BlogForm,
  type EditableBlogBlock,
} from "../../components/forms/blog-form";

const blogSnapshot = (title: string, blocks: EditableBlogBlock[]) =>
  JSON.stringify({ title, blocks });

const EMPTY_BLOG_SNAPSHOT = blogSnapshot("", []);

export default function BlogCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<EditableBlogBlock[]>([]);
  const [contentOptions, setContentOptions] = useState<ContentRecord[]>([]);
  const [diagramOptions, setDiagramOptions] = useState<DiagramRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = blogSnapshot(title, blocks) !== EMPTY_BLOG_SNAPSHOT;
  const canClear = blocks.length > 0;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [content, diagrams] = await Promise.all([
          fetchContentList(),
          fetchDiagramList(),
        ]);

        if (!cancelled) {
          setContentOptions(content);
          setDiagramOptions(diagrams);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load blog");
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
  }, []);

  const handleClear = () => {
    setError(null);
    setBlocks([]);
  };

  const handleSave = async () => {
    const payload: BlogBlockReference[] = blocks.map((block) => ({
      type: block.type,
      refId: block.refId,
    }));

    setSaving(true);
    setError(null);

    try {
      const created = await createBlog({ title, blocks: payload });
      toast.success("Blog created.");
      navigate(`/blogs/${created.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save blog";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BlogForm
      pageTitle="New Blog"
      title={title}
      blocks={blocks}
      contentOptions={contentOptions}
      diagramOptions={diagramOptions}
      loading={loading}
      saving={saving}
      dirty={dirty}
      canClear={canClear}
      clearActionLabel="Clear blocks"
      error={error}
      onBack={() => navigate("/blogs")}
      onClear={handleClear}
      onSave={handleSave}
      onTitleChange={setTitle}
      onBlocksChange={setBlocks}
    />
  );
}
