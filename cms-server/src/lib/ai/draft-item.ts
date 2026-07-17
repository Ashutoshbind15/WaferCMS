import { generateText, Output } from "ai";
import type { CollectionFieldRow } from "@packages/cms-db/collections";
import {
  buildDraftSchema,
  describeFieldsForPrompt,
  isAiGeneratableField,
} from "./field-schema.js";
import { getDefaultAiModel, getOpenRouter } from "./openrouter.js";
import { validateDraftItemValues } from "../item-values.js";

export type DraftItemInput = {
  collection: { title: string; description: string | null };
  fields: CollectionFieldRow[];
  prompt: string;
  model?: string;
};

export type DraftItemResult = {
  draft: { values: Record<string, unknown> };
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

/** Minimal empty TipTap doc — matches @wafercms/rich-text EMPTY_EDITOR_DOC. */
const EMPTY_RICHTEXT_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Minimal empty diagram doc — matches @scribblesvg/core EMPTY_DOCUMENT. */
const EMPTY_DIAGRAM_DOC = {
  version: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  elements: [] as unknown[],
};

const emptyValueForField = (field: CollectionFieldRow): unknown => {
  switch (field.fieldType) {
    case "bool":
      return false;
    case "richtext":
      return EMPTY_RICHTEXT_DOC;
    case "diagrams":
      return EMPTY_DIAGRAM_DOC;
    default:
      return null;
  }
};

/** Fill app-specific stubs (richtext/diagrams/missing keys) after AI structured output. */
const materializeGeneratedValues = (
  fields: CollectionFieldRow[],
  generated: Record<string, unknown>,
): Record<string, unknown> => {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.fieldType === "richtext" || field.fieldType === "diagrams") {
      values[field.key] = emptyValueForField(field);
      continue;
    }

    if (!(field.key in generated) || generated[field.key] === undefined) {
      values[field.key] = emptyValueForField(field);
      continue;
    }

    values[field.key] = generated[field.key];
  }

  return values;
};

type AiGenerationResult = {
  values: Record<string, unknown>;
  model: string;
  usage?: DraftItemResult["usage"];
};

/** Call the model and return values shaped by the AI Zod schema only. */
const generateAiValues = async (
  input: DraftItemInput,
): Promise<AiGenerationResult> => {
  const generatable = input.fields.filter(isAiGeneratableField);
  if (generatable.length === 0) {
    throw new Error(
      "This collection has no AI-generatable fields (text, long-text, number, date, bool).",
    );
  }

  const draftSchema = buildDraftSchema(input.fields);
  const modelId = input.model?.trim() || getDefaultAiModel();
  const openrouter = getOpenRouter();

  const system = [
    "You draft CMS collection item field values as structured JSON.",
    "Only fill fields marked ai. Omit optional fields you cannot infer.",
    "Do not invent values for skip fields (richtext, diagrams, asset, relation).",
    "Match the field types exactly (strings, numbers, booleans, YYYY-MM-DD dates).",
  ].join(" ");

  const userParts = [
    `Collection: ${input.collection.title}`,
    input.collection.description
      ? `Description: ${input.collection.description}`
      : null,
    "Fields:",
    describeFieldsForPrompt(input.fields),
    "",
    `User prompt:\n${input.prompt.trim()}`,
  ].filter((part): part is string => part != null);

  const result = await generateText({
    model: openrouter(modelId),
    system,
    prompt: userParts.join("\n"),
    output: Output.object({ schema: draftSchema }),
  });

  if (!result.output) {
    throw new Error("Model did not return a structured draft.");
  }

  return {
    values: result.output.values as Record<string, unknown>,
    model: modelId,
    usage: result.usage
      ? {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        }
      : undefined,
  };
};

export const generateItemDraft = async (
  input: DraftItemInput,
): Promise<DraftItemResult> => {
  const { values: aiValues, model, usage } = await generateAiValues(input);

  const materialized = materializeGeneratedValues(input.fields, aiValues);
  const validated = await validateDraftItemValues(input.fields, {
    values: materialized,
  });

  const values: Record<string, unknown> = {};
  for (const field of input.fields) {
    values[field.key] =
      field.key in validated ? validated[field.key] : emptyValueForField(field);
  }

  return { draft: { values }, model, usage };
};
