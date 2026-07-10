import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor, useEditorState } from "@tiptap/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import "@catppuccin/highlightjs/css/catppuccin-mocha.css";
import { richTextExtensions } from "@wafercms/rich-text";
import type { RichTextContent } from "./rich-text-document";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  CodeSquare,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Minus,
  CornerDownLeft,
  Undo2,
  Redo2,
  Eraser,
  Trash2,
  GripHorizontalIcon,
} from "lucide-react";

function RichTextEditor({
  initialContent,
  isEditable,
  onChange,
}: {
  initialContent: RichTextContent;
  isEditable: boolean;
  onChange?: (content: RichTextContent) => void;
}) {
  const isApplyingExternalContent = useRef(false);

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initialContent,
    editable: isEditable,
    editorProps: {
      attributes: {
        class: "prose prose-base m-5 focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (isApplyingExternalContent.current) {
        return;
      }

      onChange?.(currentEditor.getJSON() as RichTextContent);
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
    <div>
      {isEditable ? (
        <DragHandle
          editor={editor}
          computePositionConfig={{
            placement: "right",
          }}
        >
          <GripHorizontalIcon />
        </DragHandle>
      ) : null}
      <div>
        {isEditable ? <NormalMenu editor={editor} /> : null}
        <EditorContent
          editor={editor}
          className="h-[calc(100vh-20rem)] overflow-y-auto"
        />
      </div>
    </div>
  );
}

const MENU_STATE_FALLBACK = {
  isBold: false,
  canBold: false,
  isItalic: false,
  canItalic: false,
  isStrike: false,
  canStrike: false,
  isCode: false,
  canCode: false,
  canClearMarks: false,
  isParagraph: false,
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isHeading4: false,
  isHeading5: false,
  isHeading6: false,
  isBulletList: false,
  isOrderedList: false,
  isCodeBlock: false,
  isBlockquote: false,
  canUndo: false,
  canRedo: false,
};

const NormalMenu = ({ editor }: { editor: Editor | null }) => {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      const instance = ctx.editor;
      if (!instance) {
        return { ...MENU_STATE_FALLBACK };
      }
      return {
        isBold: instance.isActive("bold") ?? false,
        canBold: instance.can().chain().toggleBold().run() ?? false,
        isItalic: instance.isActive("italic") ?? false,
        canItalic: instance.can().chain().toggleItalic().run() ?? false,
        isStrike: instance.isActive("strike") ?? false,
        canStrike: instance.can().chain().toggleStrike().run() ?? false,
        isCode: instance.isActive("code") ?? false,
        canCode: instance.can().chain().toggleCode().run() ?? false,
        canClearMarks: instance.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: instance.isActive("paragraph") ?? false,
        isHeading1: instance.isActive("heading", { level: 1 }) ?? false,
        isHeading2: instance.isActive("heading", { level: 2 }) ?? false,
        isHeading3: instance.isActive("heading", { level: 3 }) ?? false,
        isHeading4: instance.isActive("heading", { level: 4 }) ?? false,
        isHeading5: instance.isActive("heading", { level: 5 }) ?? false,
        isHeading6: instance.isActive("heading", { level: 6 }) ?? false,
        isBulletList: instance.isActive("bulletList") ?? false,
        isOrderedList: instance.isActive("orderedList") ?? false,
        isCodeBlock: instance.isActive("codeBlock") ?? false,
        isBlockquote: instance.isActive("blockquote") ?? false,
        canUndo: instance.can().chain().undo().run() ?? false,
        canRedo: instance.can().chain().redo().run() ?? false,
      };
    },
  });

  const state = editorState ?? MENU_STATE_FALLBACK;

  if (!editor) {
    return null;
  }

  const formattingValues = [
    ...(state.isBold ? ["bold"] : []),
    ...(state.isItalic ? ["italic"] : []),
    ...(state.isStrike ? ["strike"] : []),
    ...(state.isCode ? ["code"] : []),
  ];

  const blockValues = [
    ...(state.isParagraph ? ["paragraph"] : []),
    ...(state.isHeading1 ? ["heading-1"] : []),
    ...(state.isHeading2 ? ["heading-2"] : []),
    ...(state.isHeading3 ? ["heading-3"] : []),
    ...(state.isHeading4 ? ["heading-4"] : []),
    ...(state.isHeading5 ? ["heading-5"] : []),
    ...(state.isHeading6 ? ["heading-6"] : []),
  ];

  const structureValues = [
    ...(state.isBulletList ? ["bullet-list"] : []),
    ...(state.isOrderedList ? ["ordered-list"] : []),
    ...(state.isCodeBlock ? ["code-block"] : []),
    ...(state.isBlockquote ? ["blockquote"] : []),
  ];

  const formattingControls = [
    {
      value: "bold",
      label: "Toggle bold",
      icon: Bold,
      disabled: !state.canBold,
      onToggle: () => editor.chain().focus().toggleBold().run(),
    },
    {
      value: "italic",
      label: "Toggle italic",
      icon: Italic,
      disabled: !state.canItalic,
      onToggle: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      value: "strike",
      label: "Toggle strikethrough",
      icon: Strikethrough,
      disabled: !state.canStrike,
      onToggle: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      value: "code",
      label: "Toggle code",
      icon: CodeIcon,
      disabled: !state.canCode,
      onToggle: () => editor.chain().focus().toggleCode().run(),
    },
  ];

  const blockControls = [
    {
      value: "paragraph",
      label: "Paragraph",
      icon: Pilcrow,
      onToggle: () => editor.chain().focus().setParagraph().run(),
    },
    {
      value: "heading-1",
      label: "Heading 1",
      icon: Heading1,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      value: "heading-2",
      label: "Heading 2",
      icon: Heading2,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      value: "heading-3",
      label: "Heading 3",
      icon: Heading3,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      value: "heading-4",
      label: "Heading 4",
      icon: Heading4,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
    },
    {
      value: "heading-5",
      label: "Heading 5",
      icon: Heading5,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
    },
    {
      value: "heading-6",
      label: "Heading 6",
      icon: Heading6,
      onToggle: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
    },
  ];

  const structureControls = [
    {
      value: "bullet-list",
      label: "Toggle bullet list",
      icon: List,
      onToggle: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      value: "ordered-list",
      label: "Toggle ordered list",
      icon: ListOrdered,
      onToggle: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      value: "code-block",
      label: "Toggle code block",
      icon: CodeSquare,
      onToggle: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      value: "blockquote",
      label: "Toggle blockquote",
      icon: Quote,
      onToggle: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  const actionControls = [
    {
      value: "clear-marks",
      label: "Clear marks",
      icon: Eraser,
      disabled: !state.canClearMarks,
      onToggle: () => editor.chain().focus().unsetAllMarks().run(),
    },
    {
      value: "clear-nodes",
      label: "Clear nodes",
      icon: Trash2,
      onToggle: () => editor.chain().focus().clearNodes().run(),
    },
    {
      value: "horizontal-rule",
      label: "Insert horizontal rule",
      icon: Minus,
      onToggle: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      value: "hard-break",
      label: "Insert hard break",
      icon: CornerDownLeft,
      onToggle: () => editor.chain().focus().setHardBreak().run(),
    },
    {
      value: "undo",
      label: "Undo",
      icon: Undo2,
      disabled: !state.canUndo,
      onToggle: () => editor.chain().focus().undo().run(),
    },
    {
      value: "redo",
      label: "Redo",
      icon: Redo2,
      disabled: !state.canRedo,
      onToggle: () => editor.chain().focus().redo().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={formattingValues}
        aria-label="Inline formatting controls"
      >
        {formattingControls.map((control) => (
          <ToggleGroupItem
            key={control.value}
            value={control.value}
            aria-label={control.label}
            disabled={control.disabled}
            onClick={control.onToggle}
          >
            <control.icon className="h-4 w-4" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={blockValues}
        aria-label="Block formatting controls"
      >
        {blockControls.map((control) => (
          <ToggleGroupItem
            key={control.value}
            value={control.value}
            aria-label={control.label}
            onClick={control.onToggle}
          >
            <control.icon className="h-4 w-4" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={structureValues}
        aria-label="Structure controls"
      >
        {structureControls.map((control) => (
          <ToggleGroupItem
            key={control.value}
            value={control.value}
            aria-label={control.label}
            onClick={control.onToggle}
          >
            <control.icon className="h-4 w-4" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value=""
        aria-label="Editor actions"
      >
        {actionControls.map((control) => (
          <ToggleGroupItem
            key={control.value}
            value={control.value}
            aria-label={control.label}
            disabled={control.disabled}
            onClick={control.onToggle}
          >
            <control.icon className="h-4 w-4" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default RichTextEditor;
