import {
  collectionFieldTypeValues,
  type CollectionFieldType,
} from "@packages/cms-db/schema";
import { isNonEmptyString } from "./validation";

const slugPattern = /^[a-z][a-z0-9-]*$/;

export const normalizeSlug = (value: string) => value.trim().toLowerCase();

export const normalizeFieldKey = (value: string) => value.trim().toLowerCase();

const assertValidSlug = (slug: string) => {
  if (!slugPattern.test(slug)) {
    throw new Error(
      "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens.",
    );
  }
};

const assertValidFieldKey = (key: string) => {
  if (!slugPattern.test(key)) {
    throw new Error(
      "Field key must start with a letter and contain only lowercase letters, numbers, and hyphens.",
    );
  }
};

const assertValidFieldType = (fieldType: string): CollectionFieldType => {
  if (
    !(collectionFieldTypeValues as readonly string[]).includes(fieldType)
  ) {
    throw new Error(
      `Field type must be one of: ${collectionFieldTypeValues.join(", ")}.`,
    );
  }
  return fieldType as CollectionFieldType;
};

export const parseCollectionInput = (input: {
  slug: unknown;
  title: unknown;
  description?: unknown;
}) => {
  if (!isNonEmptyString(input.title)) {
    throw new Error("Title is required.");
  }
  if (!isNonEmptyString(input.slug)) {
    throw new Error("Slug is required.");
  }

  const slug = normalizeSlug(input.slug);
  assertValidSlug(slug);

  return {
    slug,
    title: input.title.trim(),
    description:
      typeof input.description === "string"
        ? input.description.trim() || null
        : (input.description as string | null | undefined) ?? null,
  };
};

export const parseFieldInput = (input: {
  key: unknown;
  label: unknown;
  fieldType: unknown;
  required?: unknown;
}) => {
  if (!isNonEmptyString(input.key)) {
    throw new Error("Field key is required.");
  }
  if (!isNonEmptyString(input.label)) {
    throw new Error("Field label is required.");
  }

  const key = normalizeFieldKey(input.key);
  assertValidFieldKey(key);
  const fieldType = assertValidFieldType(String(input.fieldType));

  return {
    key,
    label: input.label.trim(),
    fieldType,
    required: input.required === true,
  };
};
