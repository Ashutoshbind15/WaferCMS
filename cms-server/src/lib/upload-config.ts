import { env } from "../env.js";

/** Multer / upload byte cap. Prefers CMS_UPLOAD_MAX_BYTES, else image max. */
export const uploadMaxBytes = (): number =>
  env.CMS_UPLOAD_MAX_BYTES ?? env.CMS_IMAGE_MAX_BYTES;
