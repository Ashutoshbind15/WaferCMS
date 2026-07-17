import { getFileMetadataById } from "@packages/cms-db/access";
import type { CollectionDataValueInput } from "@packages/cms-db/collection-data";
import type { CollectionFieldRow } from "@packages/cms-db/collections";
import { type CollectionFieldType } from "@packages/cms-db/schema";

export type ValidatedValue = CollectionDataValueInput & { key: string };

const validateTextValue = (fieldKey: string, value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error(
      `Item value for field "${fieldKey}" must be a string.`,
    );
  }
  return value;
};

const validateLongTextValue = (fieldKey: string, value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error(
      `Item value for field "${fieldKey}" must be a string.`,
    );
  }
  return value;
};

// TODO: export a `RichTextContent` validator from the rich-text package and
// enforce the document shape here instead of accepting arbitrary JSON.
const validateRichtextValue = (_fieldKey: string, value: unknown): unknown =>
  value;

// TODO: export a `DiagramDocument` validator from the diagrams package and
// enforce the document shape here instead of accepting arbitrary JSON.
const validateDiagramsValue = (_fieldKey: string, value: unknown): unknown =>
  value;

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const validateNumberValue = (fieldKey: string, value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Item value for field "${fieldKey}" must be a number.`,
    );
  }
  return value;
};

const validateDateValue = (fieldKey: string, value: unknown): string => {
  if (typeof value !== "string" || !DATE_VALUE_PATTERN.test(value)) {
    throw new Error(
      `Item value for field "${fieldKey}" must be a date (YYYY-MM-DD).`,
    );
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error(
      `Item value for field "${fieldKey}" must be a valid date.`,
    );
  }
  return value;
};

const validateBoolValue = (fieldKey: string, value: unknown): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(
      `Item value for field "${fieldKey}" must be a boolean.`,
    );
  }
  return value;
};

const validateAssetValue = async (
  fieldKey: string,
  value: unknown,
): Promise<number> => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Item value for field "${fieldKey}" must be a library asset id.`,
    );
  }
  const file = await getFileMetadataById(value);
  if (!file) {
    throw new Error(
      `Item value for field "${fieldKey}" references unknown asset ${value}.`,
    );
  }
  return value;
};

export const validateFieldValue = async (
  fieldType: CollectionFieldType,
  fieldKey: string,
  value: unknown,
): Promise<unknown> => {
  switch (fieldType) {
    case "text":
      return validateTextValue(fieldKey, value);
    case "long-text":
      return validateLongTextValue(fieldKey, value);
    case "richtext":
      return validateRichtextValue(fieldKey, value);
    case "diagrams":
      return validateDiagramsValue(fieldKey, value);
    case "number":
      return validateNumberValue(fieldKey, value);
    case "date":
      return validateDateValue(fieldKey, value);
    case "bool":
      return validateBoolValue(fieldKey, value);
    case "asset":
      return validateAssetValue(fieldKey, value);
  }
};

export const isItemValidationError = (message: string): boolean =>
  message.startsWith("Item value for field") ||
  message.startsWith("Unknown field key") ||
  message.includes("references unknown asset");

/**
 * Full create/update validation: unknown keys rejected, required fields enforced,
 * and each present value checked against its field type.
 */
export const validateItemValues = async (
  fields: CollectionFieldRow[],
  input: { values: Record<string, unknown> },
): Promise<ValidatedValue[]> => {
  const knownKeys = new Set(fields.map((field) => field.key));

  for (const key of Object.keys(input.values)) {
    if (!knownKeys.has(key)) {
      throw new Error(`Unknown field key "${key}".`);
    }
  }

  const result: ValidatedValue[] = [];
  for (const field of fields) {
    const raw = input.values[field.key];

    if (raw === undefined || raw === null) {
      if (field.required) {
        throw new Error(
          `Item value for field "${field.key}" is required.`,
        );
      }
      result.push({ dataId: 0, fieldId: field.id, key: field.key, value: null });
      continue;
    }

    if (field.required && typeof raw === "string" && raw.trim() === "") {
      throw new Error(`Item value for field "${field.key}" is required.`);
    }

    const value = await validateFieldValue(field.fieldType, field.key, raw);
    result.push({ dataId: 0, fieldId: field.id, key: field.key, value });
  }

  return result;
};

/**
 * Draft validation: type-check present values, allow missing required fields
 * (human fills asset/diagrams/etc. before save).
 */
export const validateDraftItemValues = async (
  fields: CollectionFieldRow[],
  input: { values: Record<string, unknown> },
): Promise<Record<string, unknown>> => {
  const knownKeys = new Set(fields.map((field) => field.key));
  const byKey = new Map(fields.map((field) => [field.key, field]));

  for (const key of Object.keys(input.values)) {
    if (!knownKeys.has(key)) {
      throw new Error(`Unknown field key "${key}".`);
    }
  }

  const values: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(input.values)) {
    const field = byKey.get(key)!;
    if (raw === undefined || raw === null) {
      values[key] = null;
      continue;
    }
    values[key] = await validateFieldValue(field.fieldType, field.key, raw);
  }

  return values;
};
