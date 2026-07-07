import { z } from "zod";
import {
  apiKeyScopeValues,
  collectionFieldTypeValues,
} from "@packages/cms-db/schema";

const slugPattern = /^[a-z][a-z0-9-]*$/;

const slugField = (
  requiredMessage: string,
  invalidMessage: string,
) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .transform((value) => value.toLowerCase())
    .refine((value) => slugPattern.test(value), { message: invalidMessage });

const multipartBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }
  return value;
}, z.boolean({ error: "isPublic must be a boolean." }));

export const loginBodySchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export const createUserBodySchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export const disableUserBodySchema = z.object({
  enabled: z.literal(false, {
    error: "Only disabling users is supported.",
  }),
});

export const createApiKeyBodySchema = z.object({
  label: z.string().trim().min(1, "Label is required."),
  scope: z.enum(apiKeyScopeValues, { error: "Invalid scope." }),
});

export const revokeApiKeyBodySchema = z.object({
  enabled: z.literal(false, {
    error: "Only revocation is supported.",
  }),
});

export const collectionBodySchema = z.object({
  slug: slugField(
    "Slug is required.",
    "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens.",
  ),
  title: z.string().trim().min(1, "Title is required."),
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        return value.trim() || null;
      }
      return value ?? null;
    }),
});

export const collectionFieldBodySchema = z.object({
  key: slugField(
    "Field key is required.",
    "Field key must start with a letter and contain only lowercase letters, numbers, and hyphens.",
  ),
  label: z.string().trim().min(1, "Field label is required."),
  fieldType: z.enum(collectionFieldTypeValues, {
    error: `Field type must be one of: ${collectionFieldTypeValues.join(", ")}.`,
  }),
  required: z.boolean().optional().default(false),
});

export const collectionItemBodySchema = z.object({
  values: z
    .unknown()
    .refine(
      (value): value is Record<string, unknown> =>
        value !== null && typeof value === "object" && !Array.isArray(value),
      { message: "values object is required." },
    ),
});

export const patchFileBodySchema = z.object({
  isPublic: z.boolean({ error: "isPublic must be a boolean." }),
});

export const uploadFileBodySchema = z.object({
  isPublic: multipartBoolean.optional().default(true),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type DisableUserBody = z.infer<typeof disableUserBodySchema>;
export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>;
export type RevokeApiKeyBody = z.infer<typeof revokeApiKeyBodySchema>;
export type CollectionBody = z.infer<typeof collectionBodySchema>;
export type CollectionFieldBody = z.infer<typeof collectionFieldBodySchema>;
export type CollectionItemBody = z.infer<typeof collectionItemBodySchema>;
export type PatchFileBody = z.infer<typeof patchFileBodySchema>;
export type UploadFileBody = z.infer<typeof uploadFileBodySchema>;
