import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import StarterKit from "@tiptap/starter-kit";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import CodeBlockComponent from "./code-block";

const lowlight = createLowlight(common);

const ExtendedCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
  tabSize: 2,
  enableTabIndentation: true,
});

export const richTextExtensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  ExtendedCodeBlock,
];
