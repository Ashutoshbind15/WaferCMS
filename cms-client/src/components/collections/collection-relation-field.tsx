import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { itemDisplayTitle } from "@/components/collections/collection-item-utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCollectionItems } from "@/lib/cms-api";
import { useCollectionFields } from "@/lib/queries";
import { cn } from "@/lib/utils";

const parseRelationId = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
};

export function relationItemPath(
  relatedCollectionId: number,
  itemId: number,
): string {
  return `/collections/${relatedCollectionId}/items/${itemId}`;
}

type RelationFieldLinkProps = {
  relatedCollectionId: number | null;
  value: unknown;
  className?: string;
};

/** Simple link to a related item (id only; no API expand). */
export function RelationFieldLink({
  relatedCollectionId,
  value,
  className,
}: RelationFieldLinkProps) {
  const itemId = parseRelationId(value);

  if (itemId === null || relatedCollectionId === null) {
    return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
  }

  return (
    <Link
      to={relationItemPath(relatedCollectionId, itemId)}
      className={cn(
        "text-sm font-medium text-foreground underline-offset-4 hover:underline",
        className,
      )}
    >
      Item #{itemId}
    </Link>
  );
}

type RelationFieldEditorProps = {
  relatedCollectionId: number | null;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
  readOnly?: boolean;
};

export function RelationFieldEditor({
  relatedCollectionId,
  value,
  onChange,
  required = false,
  readOnly = false,
}: RelationFieldEditorProps) {
  const selectedId = parseRelationId(value);
  const fieldsQuery = useCollectionFields(relatedCollectionId ?? 0);
  const itemsQuery = useQuery({
    queryKey: [
      "cms",
      "collections",
      relatedCollectionId ?? 0,
      "items",
      "relation-picker",
    ] as const,
    queryFn: () =>
      fetchCollectionItems(relatedCollectionId!, {
        page: 1,
        limit: 100,
        count: false,
        includeDrafts: true,
      }),
    enabled:
      relatedCollectionId != null &&
      Number.isInteger(relatedCollectionId) &&
      relatedCollectionId > 0,
  });
  const fields = fieldsQuery.data ?? [];
  const items = itemsQuery.data?.data ?? [];

  if (relatedCollectionId === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No related collection configured.
      </p>
    );
  }

  if (readOnly) {
    return (
      <RelationFieldLink
        relatedCollectionId={relatedCollectionId}
        value={value}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={selectedId !== null ? String(selectedId) : undefined}
        onValueChange={(next) => {
          if (next === "__none__") {
            onChange(null);
            return;
          }
          const parsed = Number(next);
          onChange(Number.isInteger(parsed) && parsed > 0 ? parsed : null);
        }}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Select related item" />
        </SelectTrigger>
        <SelectContent>
          {!required ? (
            <SelectItem value="__none__">None</SelectItem>
          ) : null}
          {itemsQuery.isPending ? (
            <SelectItem value="__loading__" disabled>
              Loading…
            </SelectItem>
          ) : items.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No items in related collection
            </SelectItem>
          ) : (
            items.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {itemDisplayTitle(item, fields)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedId !== null ? (
        <>
          <RelationFieldLink
            relatedCollectionId={relatedCollectionId}
            value={selectedId}
          />
          {!required ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(null)}
              aria-label="Clear relation"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
