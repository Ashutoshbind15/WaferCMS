import { z } from "zod";

const positiveInt = z.number().int().positive();
const page = positiveInt.optional();
const limit = positiveInt.max(100).optional();

export const listCollectionsInputSchema = z.object({
  page,
  limit,
});

export const getCollectionInputSchema = z
  .object({
    id: positiveInt.optional(),
    slug: z.string().trim().min(1).optional(),
  })
  .refine((value) => value.id != null || value.slug != null, {
    message: "Provide id or slug.",
  });

export const listFieldsInputSchema = z.object({
  collectionId: positiveInt,
});

export const getFieldInputSchema = z.object({
  collectionId: positiveInt,
  fieldId: positiveInt,
});

export const listItemsInputSchema = z.object({
  collectionId: positiveInt,
  page,
  limit,
  includeDrafts: z.boolean().optional(),
});

export const getItemInputSchema = z.object({
  collectionId: positiveInt,
  itemId: positiveInt,
  includeDrafts: z.boolean().optional(),
});

export const createItemInputSchema = z.object({
  collectionId: positiveInt,
  values: z.record(z.string(), z.unknown()),
  /** Defaults to draft for safety; pass false only when publishing intentionally. */
  draft: z.boolean().optional().default(true),
});

export const updateItemInputSchema = z.object({
  collectionId: positiveInt,
  itemId: positiveInt,
  values: z.record(z.string(), z.unknown()),
  /** When omitted, the existing draft/published flag is preserved. */
  draft: z.boolean().optional(),
});
export const deleteItemInputSchema = z.object({
  collectionId: positiveInt,
  itemId: positiveInt,
});

export const listFilesInputSchema = z.object({
  page,
  limit,
});

export const getFileMetaInputSchema = z.object({
  id: positiveInt,
});
