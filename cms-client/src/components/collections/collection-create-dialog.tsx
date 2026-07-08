import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CollectionMetadataFields } from "@/components/forms/collection-metadata-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCollection } from "@/lib/queries";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const collectionSnapshot = (input: {
  slug: string;
  title: string;
  description: string;
}) => JSON.stringify(input);

const EMPTY_SNAPSHOT = collectionSnapshot({
  slug: "",
  title: "",
  description: "",
});

type CollectionCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollectionCreateDialog({
  open,
  onOpenChange,
}: CollectionCreateDialogProps) {
  const navigate = useNavigate();
  const createCollection = useCreateCollection();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSlug("");
    setTitle("");
    setDescription("");
    setSlugTouched(false);
    setError(null);
  }, [open]);

  const dirty =
    collectionSnapshot({ slug, title, description }) !== EMPTY_SNAPSHOT;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const canSubmit = dirty && title.trim().length > 0 && slug.length > 0;
  const saving = createCollection.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    try {
      const created = await createCollection.mutateAsync({
        slug,
        title,
        description: description || null,
      });
      toast.success("Collection created.");
      onOpenChange(false);
      navigate(`/collections/${created.id}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create collection";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Name your content type. You can add fields and items next.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <CollectionMetadataFields
          idPrefix="collection-create"
          slug={slug}
          title={title}
          description={description}
          onSlugChange={handleSlugChange}
          onTitleChange={handleTitleChange}
          onDescriptionChange={setDescription}
        />

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={saving || !canSubmit}
            onClick={() => void handleSubmit()}
          >
            {saving ? "Creating…" : "Create collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
