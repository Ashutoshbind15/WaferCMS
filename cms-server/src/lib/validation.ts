export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const parseTitle = (title: unknown): string => {
  if (!isNonEmptyString(title)) {
    throw new Error("Title is required.");
  }
  return title.trim();
};
