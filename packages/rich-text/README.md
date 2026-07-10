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

### Required: typography & syntax highlighting

This package does **not** ship typography or syntax-color styles. Install and wire these up in your app or headings/lists look plain and code blocks have no colors.

**1. Typography (`prose` classes)**

`RichTextReadOnly` defaults the content root to `wafer-rich-text__content prose prose-base`. The `prose` / `prose-`* classes only take effect if you provide styles for them - typically [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin):

```bash
npm install @tailwindcss/typography
```

```css
/* e.g. in your app CSS (Tailwind v4) */
@plugin "@tailwindcss/typography";
```

Override via `contentClassName` on `RichTextReadOnly` if you use different typography classes - you still need whatever CSS makes those classes work.

**2. Syntax highlighting (code blocks)**

Code blocks use [lowlight](https://github.com/wooorm/lowlight), which emits `hljs-`* classes. Load a [highlight.js theme](https://highlightjs.org/demo) in your app:

```bash
npm install highlight.js
```

```ts
import "highlight.js/styles/github-dark.css";
// or any other theme, e.g. highlight.js/styles/github.css
```

## License

MIT