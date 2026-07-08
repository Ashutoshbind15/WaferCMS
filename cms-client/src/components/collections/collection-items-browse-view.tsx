import { Fragment } from "react";
import { CollectionItemFieldEditors } from "@/components/collections/collection-item-field-editors";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  type CollectionFieldRecord,
  type CollectionItemRecord,
} from "@/lib/cms-api";

const previewValue = (
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string => {
  const previewField = fields.find(
    (field) => field.fieldType === "text" || field.fieldType === "long-text",
  );
  if (!previewField) {
    return "";
  }
  const value = item.values[previewField.key];
  return typeof value === "string" ? value : "";
};

type CollectionItemsBrowseViewProps = {
  items: CollectionItemRecord[];
  fields: CollectionFieldRecord[];
  selectedItemId: number | null;
  onSelect: (itemId: number) => void;
  onEdit: (itemId: number) => void;
  deletingId: number | null;
  onDelete: (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: number,
  ) => void;
};

export function CollectionItemsBrowseView({
  items,
  fields,
  selectedItemId,
  onSelect,
  onEdit,
  deletingId,
  onDelete,
}: CollectionItemsBrowseViewProps) {
  const selected =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  if (!selected) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-border">
        {items.map((item, index) => {
          const preview = previewValue(item, fields);
          const isActive = item.id === selected.id;
          return (
            <Fragment key={item.id}>
              {index > 0 ? <Separator /> : null}
              <div className="group flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelect(item.id)}
                  className={`min-w-0 flex-1 px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-accent" : "hover:bg-accent/40"
                  }`}
                >
                  <p
                    className={`truncate text-sm ${
                      isActive ? "font-medium" : ""
                    }`}
                  >
                    {preview || `Item #${item.id}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  disabled={deletingId === item.id}
                  onClick={(event) => void onDelete(event, item.id)}
                >
                  {deletingId === item.id ? "…" : "Delete"}
                </Button>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="min-w-0 rounded-lg border border-border bg-accent/20 p-4 ring-1 ring-accent">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {previewValue(selected, fields) || `Item #${selected.id}`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              updated {new Date(selected.updatedAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(selected.id)}
          >
            Edit
          </Button>
        </div>
        <CollectionItemFieldEditors
          fields={fields}
          values={selected.values}
          readOnly
        />
      </div>
    </div>
  );
}
