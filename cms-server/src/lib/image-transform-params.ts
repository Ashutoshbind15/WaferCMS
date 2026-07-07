import { z } from "zod";
import type { Request } from "express";

const fitValues = ["cover", "contain", "inside", "outside"] as const;
export type ImageFit = (typeof fitValues)[number];

const dimensionField = z.coerce
  .number()
  .int()
  .min(1, "Dimension must be a positive integer.")
  .max(4096, "Dimension must be 4096 or less.");

const qualityField = z.coerce
  .number()
  .int()
  .min(1, "Quality must be between 1 and 100.")
  .max(100, "Quality must be between 1 and 100.");

const imageTransformSchema = z
  .object({
    w: dimensionField.optional(),
    h: dimensionField.optional(),
    fit: z.enum(fitValues, {
      error: `fit must be one of: ${fitValues.join(", ")}.`,
    }),
    format: z.literal("webp", { error: "format must be webp." }),
    q: qualityField,
  })
  .partial();

export type ImageTransformParams = {
  w?: number;
  h?: number;
  fit?: ImageFit;
  format?: "webp";
  q?: number;
};

export class ImageTransformParseError extends Error {}

const firstValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const pickRelevant = (query: Request["query"]): Record<string, unknown> => ({
  w: firstValue(query.w),
  h: firstValue(query.h),
  fit: firstValue(query.fit),
  format: firstValue(query.format),
  q: firstValue(query.q),
});

/**
 * Parse transform params from a request query. Returns `null` when no
 * transform is requested (no `w`, `h`, or `format`). Throws
 * `ImageTransformParseError` on invalid values.
 */
export const parseImageTransformQuery = (
  query: Request["query"],
): ImageTransformParams | null => {
  const relevant = pickRelevant(query);
  const hasAny =
    relevant.w !== undefined ||
    relevant.h !== undefined ||
    relevant.format !== undefined;
  if (!hasAny) {
    return null;
  }

  const parsed = imageTransformSchema.safeParse(relevant);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ImageTransformParseError(first?.message ?? "Invalid transform.");
  }

  return parsed.data as ImageTransformParams;
};

/**
 * Fill in defaults: `fit` is `cover` when both w+h are set, else `inside`;
 * `q` defaults to 80. Returns a stable, canonical string for cache keys/logs.
 */
export const normalizeTransformParams = (
  params: ImageTransformParams,
): {
  w?: number;
  h?: number;
  fit: ImageFit;
  format?: "webp";
  q: number;
  canonical: string;
} => {
  const fit: ImageFit =
    params.fit ?? (params.w !== undefined && params.h !== undefined ? "cover" : "inside");
  const q = params.q ?? 80;
  const parts = [
    params.w !== undefined ? `w=${params.w}` : null,
    params.h !== undefined ? `h=${params.h}` : null,
    `fit=${fit}`,
    params.format ? `format=${params.format}` : null,
    `q=${q}`,
  ].filter((p): p is string => p !== null);
  return {
    w: params.w,
    h: params.h,
    fit,
    format: params.format,
    q,
    canonical: parts.join("&"),
  };
};
