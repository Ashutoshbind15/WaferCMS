import { z } from "zod";
import type { CollectionFieldType } from "@packages/cms-db/schema";

export type AiFieldInput = {
  key: string;
  label: string;
  fieldType: CollectionFieldType;
  required: boolean;
};

/** Field types the model fills. Other types (richtext, diagrams, asset, relation) are skipped. */
export const AI_GENERATABLE_FIELD_TYPES = new Set<CollectionFieldType>([
  "text",
  "long-text",
  "number",
  "date",
  "bool",
]);

type AiGeneratableFieldType =
  | "text"
  | "long-text"
  | "number"
  | "date"
  | "bool";

type AiGeneratableField = AiFieldInput & {
  fieldType: AiGeneratableFieldType;
};

export const isAiGeneratableField = (
  field: AiFieldInput,
): field is AiGeneratableField =>
  AI_GENERATABLE_FIELD_TYPES.has(field.fieldType);

const leafFor = (field: AiGeneratableField): z.ZodType => {
  switch (field.fieldType) {
    case "text":
      return z
        .string()
        .describe(`Short plain text for "${field.label}" (${field.key}).`);
    case "long-text":
      return z
        .string()
        .describe(
          `Longer plain text / multi-paragraph content for "${field.label}" (${field.key}).`,
        );
    case "number":
      return z
        .number()
        .describe(`Numeric value for "${field.label}" (${field.key}).`);
    case "date":
      return z.iso
        .date()
        .describe(
          `Calendar date as YYYY-MM-DD for "${field.label}" (${field.key}).`,
        );
    case "bool":
      return z
        .boolean()
        .describe(`Boolean true/false for "${field.label}" (${field.key}).`);
  }
};

/**
 * Build a Zod object schema for structured LLM output over generatable fields.
 * Optional fields are `.optional()` so the model may omit them.
 */
export const buildValuesSchema = (fields: AiFieldInput[]) => {
  const generatable = fields.filter(isAiGeneratableField);
  const shape: Record<string, z.ZodType> = {};

  for (const field of generatable) {
    const leaf = leafFor(field);
    shape[field.key] = field.required ? leaf : leaf.optional();
  }

  return z.object(shape);
};

export const buildDraftSchema = (fields: AiFieldInput[]) =>
  z.object({
    values: buildValuesSchema(fields),
  });

export const describeFieldsForPrompt = (fields: AiFieldInput[]): string => {
  const lines = fields.map((field) => {
    const flags = [
      field.required ? "required" : "optional",
      isAiGeneratableField(field) ? "ai" : "skip",
    ].join(", ");
    return `- ${field.key} (${field.label}): type=${field.fieldType}; ${flags}`;
  });
  return lines.join("\n");
};
