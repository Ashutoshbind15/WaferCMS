import { env } from "../env.js";

export const imageMaxBytes = (): number => env.CMS_IMAGE_MAX_BYTES;

export const imageMaxDimension = (): number => env.CMS_IMAGE_MAX_DIMENSION;
