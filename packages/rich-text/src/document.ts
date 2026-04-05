export type RichTextContent = Record<string, unknown>;

export const EMPTY_EDITOR_DOC: RichTextContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function normalizeRichTextPayload(payload: unknown): RichTextContent {
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    (payload as { type?: unknown }).type === "doc"
  ) {
    return payload as RichTextContent;
  }
  return EMPTY_EDITOR_DOC;
}
