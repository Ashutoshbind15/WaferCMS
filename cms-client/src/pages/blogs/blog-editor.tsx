import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  fetchBlog,
  fetchContentList,
  fetchDiagramList,
  updateBlog,
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

const toEditableBlocks = (
  blocks: Array<Pick<BlogBlockReference, "type" | "refId">>,
) => blocks.map((block) => ({ type: block.type, refId: block.refId }));

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<EditableBlogBlock[]>([]);
  const [contentOptions, setContentOptions] = useState<ContentRecord[]>([]);
  const [diagramOptions, setDiagramOptions] = useState<DiagramRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_BLOG_SNAPSHOT);

  const dirty = !loading && blogSnapshot(title, blocks) !== savedSnapshot;
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

        if (cancelled) {
          return;
        }

        setContentOptions(content);
        setDiagramOptions(diagrams);

        const blog = await fetchBlog(Number(id));
        if (!cancelled) {
          const nextBlocks = toEditableBlocks(blog.blocks);
          setTitle(blog.title);
          setBlocks(nextBlocks);
          setSavedSnapshot(blogSnapshot(blog.title, nextBlocks));
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
  }, [id]);

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
      const updated = await updateBlog(Number(id), { title, blocks: payload });
      const nextBlocks = toEditableBlocks(updated.blocks);
      setTitle(updated.title);
      setBlocks(nextBlocks);
      setSavedSnapshot(blogSnapshot(updated.title, nextBlocks));
      toast.success("Blog saved.");
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
      pageTitle="Edit Blog"
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
