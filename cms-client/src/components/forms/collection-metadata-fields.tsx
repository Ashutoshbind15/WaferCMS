import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CollectionMetadataFieldsProps = {
  slug: string;
  title: string;
  description: string;
  idPrefix?: string;
  onSlugChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function CollectionMetadataFields({
  slug,
  title,
  description,
  idPrefix = "collection",
  onSlugChange,
  onTitleChange,
  onDescriptionChange,
}: CollectionMetadataFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-title`} className="text-sm font-medium">
          Title
        </label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Projects"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-slug`} className="text-sm font-medium">
          Slug
        </label>
        <Input
          id={`${idPrefix}-slug`}
          placeholder="projects"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only. Mostly for API clients.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-description`}
          className="text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Optional description for this collection"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
