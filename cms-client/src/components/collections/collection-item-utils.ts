import type {
  CollectionFieldRecord,
  CollectionItemRecord,
} from "@/lib/cms-api";

export function itemPreviewTitle(
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string {
  const titleField = fields.find((field) => field.isTitle);
  if (!titleField) {
    return "";
  }
  const value = item.values[titleField.key];
  return typeof value === "string" ? value.trim() : "";
}

export function itemDisplayTitle(
  item: CollectionItemRecord,
  fields: CollectionFieldRecord[],
): string {
  return itemPreviewTitle(item, fields) || `Item ${item.id}`;
}
