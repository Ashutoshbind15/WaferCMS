"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { RichTextContent } from "./document";
import { richTextExtensions } from "./extensions";

export function RichTextReadOnly({
  initialContent,
}: {
  initialContent: RichTextContent;
}) {
  const isApplyingExternalContent = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions,
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-base m-5 focus:outline-none",
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

  return (
    <EditorContent
      editor={editor}
      className="min-h-[200px] overflow-y-auto"
    />
  );
}
