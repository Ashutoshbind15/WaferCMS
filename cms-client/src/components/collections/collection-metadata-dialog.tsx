import { useEffect, useState } from "react";
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
import type { CollectionRecord } from "@/lib/cms-api";

const collectionSnapshot = (input: {
  slug: string;
  title: string;
  description: string;
}) => JSON.stringify(input);

type CollectionMetadataDialogProps = {
  open: boolean;
  record: CollectionRecord | null;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    slug: string;
    title: string;
    description: string;
  }) => Promise<void>;
};

export function CollectionMetadataDialog({
  open,
  record,
  saving,
  error,
  onOpenChange,
  onSave,
}: CollectionMetadataDialogProps) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    const next = {
      slug: record.slug,
      title: record.title,
      description: record.description ?? "",
    };
    setSlug(next.slug);
    setTitle(next.title);
    setDescription(next.description);
    setSavedSnapshot(collectionSnapshot(next));
  }, [open, record]);

  const dirty =
    collectionSnapshot({ slug, title, description }) !== savedSnapshot;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && record) {
      setSlug(record.slug);
      setTitle(record.title);
      setDescription(record.description ?? "");
      setSavedSnapshot(
        collectionSnapshot({
          slug: record.slug,
          title: record.title,
          description: record.description ?? "",
        }),
      );
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    await onSave({ slug, title, description });
    setSavedSnapshot(collectionSnapshot({ slug, title, description }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection settings</DialogTitle>
          <DialogDescription>
            Update the title, slug, and description for this collection.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <CollectionMetadataFields
          idPrefix="collection-settings"
          slug={slug}
          title={title}
          description={description}
          onSlugChange={setSlug}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
        />

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={saving || !dirty} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
