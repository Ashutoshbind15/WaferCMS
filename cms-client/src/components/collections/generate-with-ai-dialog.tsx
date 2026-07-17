import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDraftCollectionItem } from "@/lib/queries";
import { toast } from "sonner";

type GenerateWithAiDialogProps = {
  collectionId: number;
  disabled?: boolean;
  onDraft: (values: Record<string, unknown>) => void;
};

export function GenerateWithAiDialog({
  collectionId,
  disabled = false,
  onDraft,
}: GenerateWithAiDialogProps) {
  const draftItem = useDraftCollectionItem(collectionId);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generating = draftItem.isPending;
  const canSubmit = prompt.trim().length > 0 && !generating;

  const reset = () => {
    setPrompt("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (generating) {
      return;
    }
    if (!next) {
      reset();
    }
    setOpen(next);
  };

  const handleGenerate = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    try {
      const result = await draftItem.mutateAsync({
        prompt: prompt.trim(),
      });
      onDraft(result.draft.values);
      toast.success("Draft generated — review and save when ready.");
      handleOpenChange(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to generate draft";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || generating}>
          <Sparkles className="mr-1 h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={!generating}
        aria-busy={generating}
        onPointerDownOutside={(e) => {
          if (generating) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (generating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Generate with AI</DialogTitle>
          <DialogDescription>
            Describe the item you want. The model fills text, number, date, and
            bool fields — richtext and diagrams stay empty for you to edit.
            Nothing is stored until you save.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-draft-prompt">Prompt</Label>
            <Textarea
              id="ai-draft-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A short product announcement for our summer sale…"
              rows={4}
              disabled={generating}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {generating ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-background/80 backdrop-blur-[1px]"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-muted-foreground"
                aria-hidden
              />
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Generating draft…</p>
                <p className="text-xs text-muted-foreground">
                  This can take a few seconds. Please wait.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => void handleGenerate()}
          >
            {generating ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            {generating ? "Generating…" : "Generate draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
