import type {
  CollectionFieldRecord,
  CollectionItemRecord,
} from "@/lib/cms-api";

export function itemPreviewTitle(
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string {
  const previewField = fields.find(
    (field) => field.fieldType === "text" || field.fieldType === "long-text",
  );
  if (!previewField) {
    return "";
  }
  const value = item.values[previewField.key];
  return typeof value === "string" ? value : "";
}

export function itemDisplayTitle(
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string {
  return itemPreviewTitle(item, fields) || `Item #${item.id}`;
}
