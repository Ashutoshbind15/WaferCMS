# @wafercms/rich-text

Shared rich-text helpers and a read-only renderer for [WaferCMS](https://github.com/Ashutoshbind15/WaferCMS).

Built on [TipTap](https://tiptap.dev/). Documents use TipTap JSON; `richTextExtensions` is a TipTap extension array you can pass to `useEditor` or merge with your own extensions.

## Install

```bash
# Using npm
npm install @wafercms/rich-text

# Using pnpm
pnpm add @wafercms/rich-text

# Using yarn
yarn add @wafercms/rich-text

# Using bun
bun add @wafercms/rich-text
```

Peer dependencies: React 18 or 19.

## Usage

### Read-only preview

```tsx
import {
  EMPTY_EDITOR_DOC,
  RichTextReadOnly,
  type RichTextContent,
} from "@wafercms/rich-text";

function Preview({ content = EMPTY_EDITOR_DOC }: { content?: RichTextContent }) {
  return <RichTextReadOnly initialContent={content} />;
}
```

`EMPTY_EDITOR_DOC` is a blank document seed for new content.

### Editable editor

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import {
  EMPTY_EDITOR_DOC,
  richTextExtensions,
  type RichTextContent,
} from "@wafercms/rich-text";

function Editor({
  content = EMPTY_EDITOR_DOC,
}: {
  content?: RichTextContent;
}) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content,
  });

  return <EditorContent editor={editor} />;
}
```

## License

MIT
