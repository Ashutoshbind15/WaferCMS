import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  mockBlogs,
  mockContent,
  mockDiagrams,
  mockLibraryImages,
  type BlogBlock,
  type BlogBlockType,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  FileText,
  PenTool,
  ImageIcon,
  Plus,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

let blockCounter = 100;

function createMockBlock(type: BlogBlockType): BlogBlock {
  blockCounter++;
  const id = `block-new-${blockCounter}`;
  switch (type) {
    case "content": {
      const ref = mockContent[0];
      return { id, type, refId: ref.id, refTitle: ref.title };
    }
    case "diagram": {
      const ref = mockDiagrams[0];
      return { id, type, refId: ref.id, refTitle: ref.title };
    }
    case "image": {
      const ref = mockLibraryImages[0];
      return { id, type, refId: ref.id, refTitle: ref.name };
    }
  }
}

const blockTypeLabels: Record<BlogBlockType, string> = {
  content: "Content",
  diagram: "Diagram",
  image: "Image",
};

const blockTypeIcons: Record<BlogBlockType, typeof FileText> = {
  content: FileText,
  diagram: PenTool,
  image: ImageIcon,
};

// ── Block Row ────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEdit,
}: {
  block: BlogBlock;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const Icon = blockTypeIcons[block.type];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {/* Type icon + label */}
      <div className="flex items-center gap-2 rounded-md bg-accent px-2.5 py-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {blockTypeLabels[block.type]}
        </span>
      </div>

      {/* Reference title */}
      <p className="min-w-0 flex-1 truncate text-sm">{block.refTitle}</p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={onEdit} title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Blog Editor Page ─────────────────────────────────────────────────────────

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const existing = mockBlogs.find((b) => b.id === id);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [blocks, setBlocks] = useState<BlogBlock[]>(existing?.blocks ?? []);

  // ── Block operations ───────────────────────────────────────────────────

  const addBlock = (type: BlogBlockType) => {
    setBlocks((prev) => [...prev, createMockBlock(type)]);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const editBlock = (block: BlogBlock) => {
    switch (block.type) {
      case "content":
        navigate(`/content/${block.refId}`);
        break;
      case "diagram":
        navigate(`/diagrams/${block.refId}`);
        break;
      case "image":
        navigate("/library");
        break;
    }
  };

  return (
    <>
      <Header
        title="Edit Blog"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/blogs")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                console.log("Save blog", { id, title, blocks });
              }}
            >
              Save
            </Button>
          </div>
        }
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Title */}
          <Input
            placeholder="Blog title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold h-11"
          />

          {/* Block list */}
          <div className="space-y-2">
            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No blocks yet. Add content, diagrams, or images below.
                </p>
              </div>
            )}
            {blocks.map((block, index) => (
              <BlockRow
                key={block.id}
                block={block}
                index={index}
                total={blocks.length}
                onMoveUp={() => moveBlock(index, "up")}
                onMoveDown={() => moveBlock(index, "down")}
                onRemove={() => removeBlock(index)}
                onEdit={() => editBlock(block)}
              />
            ))}
          </div>

          {/* Add block actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock("content")}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Content
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock("diagram")}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Diagram
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock("image")}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Image
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
