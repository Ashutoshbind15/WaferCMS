export type RichTextContent = Record<string, unknown>;

export const EMPTY_EDITOR_DOC: RichTextContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
