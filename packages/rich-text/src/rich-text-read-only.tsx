"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { RichTextContent } from "./document";
import { richTextExtensions } from "./extensions";
import "./styles.css";

const DEFAULT_CONTENT_CLASS = "wafer-rich-text__content prose prose-base";
const DEFAULT_WRAPPER_CLASS = "wafer-rich-text";

export function RichTextReadOnly({
  initialContent,
  contentClassName = DEFAULT_CONTENT_CLASS,
  className = DEFAULT_WRAPPER_CLASS,
}: {
  initialContent: RichTextContent;
  /**
   * Classes on the TipTap content root. Include `prose` (and any size/color
   * variants) so `@tailwindcss/typography` styles apply.
   */
  contentClassName?: string;
  /** Classes on the outer `EditorContent` wrapper. */
  className?: string;
}) {
  const isApplyingExternalContent = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions,
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class: contentClassName,
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (JSON.stringify(editor.getJSON()) === JSON.stringify(initialContent)) {
      return;
    }

    isApplyingExternalContent.current = true;
    try {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    } finally {
      isApplyingExternalContent.current = false;
    }
  }, [editor, initialContent]);

  return <EditorContent editor={editor} className={className} />;
}
