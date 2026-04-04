import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  Plus,
  Trash2,
} from "lucide-react";
import { type ContentRecord, type DiagramRecord } from "@/lib/cms-api";

export type EditableBlogBlock = {
  type: "content" | "diagram";
  refId: number;
};

const blockTypeIcons = {
  content: FileText,
  diagram: PenTool,
};

const blockTypeLabels = {
  content: "Content",
  diagram: "Diagram",
};

function BlogBlockRow({
  block,
  index,
  total,
  contentOptions,
  diagramOptions,
  onTypeChange,
  onRefChange,
  onMove,
  onRemove,
}: {
  block: EditableBlogBlock;
  index: number;
  total: number;
  contentOptions: ContentRecord[];
  diagramOptions: DiagramRecord[];
  onTypeChange: (type: EditableBlogBlock["type"]) => void;
  onRefChange: (refId: number) => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  const Icon = blockTypeIcons[block.type];
  const options = block.type === "content" ? contentOptions : diagramOptions;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 rounded-md bg-accent px-2.5 py-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {blockTypeLabels[block.type]}
          </span>
        </div>

        <Select
          value={block.type}
          onValueChange={(value) =>
            onTypeChange(value as EditableBlogBlock["type"])
          }
        >
          <SelectTrigger className="w-full md:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="diagram">Diagram</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={block.refId > 0 ? String(block.refId) : undefined}
          onValueChange={(value) => onRefChange(Number(value))}
        >
          <SelectTrigger className="w-full md:flex-1">
            <SelectValue placeholder={`Select ${block.type}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === 0}
            onClick={() => onMove("up")}
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
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
    </div>
  );
}

type BlogFormProps = {
  pageTitle: string;
  title: string;
  blocks: EditableBlogBlock[];
  contentOptions: ContentRecord[];
  diagramOptions: DiagramRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onSave: () => Promise<void> | void;
  onTitleChange: (value: string) => void;
  onBlocksChange: Dispatch<SetStateAction<EditableBlogBlock[]>>;
};

export function BlogForm({
  pageTitle,
  title,
  blocks,
  contentOptions,
  diagramOptions,
  loading,
  saving,
  error,
  onBack,
  onSave,
  onTitleChange,
  onBlocksChange,
}: BlogFormProps) {
  const fallbackContentId = contentOptions[0]?.id ?? 0;
  const fallbackDiagramId = diagramOptions[0]?.id ?? 0;

  const canAddContent = fallbackContentId > 0;
  const canAddDiagram = fallbackDiagramId > 0;

  useEffect(() => {
    onBlocksChange((prev) => {
      let changed = false;

      const next = prev.map((block) => {
        if (
          block.type === "content" &&
          block.refId === 0 &&
          fallbackContentId > 0
        ) {
          changed = true;
          return { ...block, refId: fallbackContentId };
        }

        if (
          block.type === "diagram" &&
          block.refId === 0 &&
          fallbackDiagramId > 0
        ) {
          changed = true;
          return { ...block, refId: fallbackDiagramId };
        }

        return block;
      });

      return changed ? next : prev;
    });
  }, [fallbackContentId, fallbackDiagramId, onBlocksChange]);

  const addBlock = (type: EditableBlogBlock["type"]) => {
    onBlocksChange((prev) => [
      ...prev,
      {
        type,
        refId: type === "content" ? fallbackContentId : fallbackDiagramId,
      },
    ]);
  };

  const removeBlock = (index: number) => {
    onBlocksChange((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    onBlocksChange((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) {
        return prev;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateBlock = (index: number, next: Partial<EditableBlogBlock>) => {
    onBlocksChange((prev) =>
      prev.map((block, currentIndex) => {
        if (currentIndex !== index) {
          return block;
        }

        const merged = { ...block, ...next };
        if (next.type === "content") {
          return { type: "content", refId: fallbackContentId };
        }
        if (next.type === "diagram") {
          return { type: "diagram", refId: fallbackDiagramId };
        }
        return merged;
      }),
    );
  };

  return (
    <>
      <Header
        title={pageTitle}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button disabled={saving || loading} onClick={() => void onSave()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />
      <PageContainer>
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <Input
              placeholder="Blog title..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-11 text-lg font-semibold"
            />

            <div className="space-y-2">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No blocks yet. Add content or diagrams below.
                  </p>
                </div>
              ) : null}

              {blocks.map((block, index) => (
                <BlogBlockRow
                  key={`${block.type}-${index}-${block.refId}`}
                  block={block}
                  index={index}
                  total={blocks.length}
                  contentOptions={contentOptions}
                  diagramOptions={diagramOptions}
                  onTypeChange={(type) => updateBlock(index, { type })}
                  onRefChange={(refId) => updateBlock(index, { refId })}
                  onMove={(direction) => moveBlock(index, direction)}
                  onRemove={() => removeBlock(index)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canAddContent}
                onClick={() => addBlock("content")}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Content
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canAddDiagram}
                onClick={() => addBlock("diagram")}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Diagram
              </Button>
            </div>

            {!canAddContent ? (
              <p className="text-sm text-muted-foreground">
                Create at least one content record before adding a content
                block.
              </p>
            ) : null}

            {!canAddDiagram ? (
              <p className="text-sm text-muted-foreground">
                Create at least one diagram record before adding a diagram
                block.
              </p>
            ) : null}
          </div>
        )}
      </PageContainer>
    </>
  );
}
