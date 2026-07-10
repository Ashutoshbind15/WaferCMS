import sharp from "sharp";
import {
  normalizeTransformParams,
  type ImageTransformParams,
} from "./image-transform-params.js";
import { imageMaxDimension } from "./image-config.js";

export type TransformedImage = {
  buffer: Buffer;
  contentType: string;
};

export class ImageTransformError extends Error {}

const contentTypeFor = (format: "webp" | "jpeg" | "png"): string =>
  `image/${format}`;

/**
 * Run the configured transform pipeline on an image buffer. When `format` is
 * omitted, sharp auto-selects the source format; we map known outputs to a
 * Content-Type so callers can set response headers without inspecting bytes.
 */
export const transformImage = async (
  input: Buffer,
  params: ImageTransformParams,
  _sourceContentType: string | null,
): Promise<TransformedImage> => {
  const maxDimension = imageMaxDimension();
  const maxPixels = maxDimension * maxDimension;

  const norm = normalizeTransformParams(params);
  const w = norm.w !== undefined ? Math.min(norm.w, maxDimension) : undefined;
  const h = norm.h !== undefined ? Math.min(norm.h, maxDimension) : undefined;

  let pipeline = sharp(input, { limitInputPixels: maxPixels }).rotate();

  if (w !== undefined || h !== undefined) {
    pipeline = pipeline.resize(w, h, {
      fit: norm.fit,
      withoutEnlargement: true,
    });
  }

  if (norm.format === "webp") {
    const buffer = await pipeline
      .webp({ quality: norm.q })
      .toBuffer({ resolveWithObject: true });
    return { buffer: buffer.data, contentType: contentTypeFor("webp") };
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });
  const format = result.info.format;
  const contentType =
    format === "jpeg" || format === "png" || format === "webp"
      ? contentTypeFor(format)
      : "image/*";
  return { buffer: result.data, contentType };
};
