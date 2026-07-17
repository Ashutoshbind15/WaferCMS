import { getFileMetadataById } from "@packages/cms-db/access";
import {
  selectCollectionDataById,
  type CollectionDataValueInput,
} from "@packages/cms-db/collection-data";
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

const validateRelationValue = async (
  fieldKey: string,
  relatedCollectionId: number | null,
  value: unknown,
): Promise<number> => {
  if (relatedCollectionId === null) {
    throw new Error(
      `Item value for field "${fieldKey}" has no related collection configured.`,
    );
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Item value for field "${fieldKey}" must be a related item id.`,
    );
  }
  const item = await selectCollectionDataById(relatedCollectionId, value, {
    includeDrafts: true,
  });
  if (!item) {
    throw new Error(
      `Item value for field "${fieldKey}" references unknown related item ${value}.`,
    );
  }
  return value;
};

type FieldValueContext = {
  fieldType: CollectionFieldType;
  fieldKey: string;
  relatedCollectionId: number | null;
};

export const validateFieldValue = async (
  field: FieldValueContext,
  value: unknown,
): Promise<unknown> => {
  switch (field.fieldType) {
    case "text":
      return validateTextValue(field.fieldKey, value);
    case "long-text":
      return validateLongTextValue(field.fieldKey, value);
    case "richtext":
      return validateRichtextValue(field.fieldKey, value);
    case "diagrams":
      return validateDiagramsValue(field.fieldKey, value);
    case "number":
      return validateNumberValue(field.fieldKey, value);
    case "date":
      return validateDateValue(field.fieldKey, value);
    case "bool":
      return validateBoolValue(field.fieldKey, value);
    case "asset":
      return validateAssetValue(field.fieldKey, value);
    case "relation":
      return validateRelationValue(
        field.fieldKey,
        field.relatedCollectionId,
        value,
      );
  }
};

export const isItemValidationError = (message: string): boolean =>
  message.startsWith("Item value for field") ||
  message.startsWith("Unknown field key") ||
  message.includes("references unknown asset") ||
  message.includes("references unknown related item");

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

    const value = await validateFieldValue(
      {
        fieldType: field.fieldType,
        fieldKey: field.key,
        relatedCollectionId: field.relatedCollectionId,
      },
      raw,
    );
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
    values[key] = await validateFieldValue(
      {
        fieldType: field.fieldType,
        fieldKey: field.key,
        relatedCollectionId: field.relatedCollectionId,
      },
      raw,
    );
  }

  return values;
};
