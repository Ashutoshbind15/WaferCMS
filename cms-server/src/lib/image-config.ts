const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 4096;

export const imageMaxBytes = (): number =>
  parsePositiveInt(process.env.CMS_IMAGE_MAX_BYTES, DEFAULT_MAX_BYTES);

export const imageMaxDimension = (): number =>
  parsePositiveInt(process.env.CMS_IMAGE_MAX_DIMENSION, DEFAULT_MAX_DIMENSION);
