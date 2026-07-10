# @wafercms/rich-text

Shared rich-text helpers for [WaferCMS](https://github.com/Ashutoshbind15/WaferCMS): document types and a read-only renderer.

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

```tsx
import {
  EMPTY_EDITOR_DOC,
  RichTextReadOnly,
  type RichTextContent,
} from "@wafercms/rich-text";

function Preview({ content }: { content: RichTextContent }) {
  return <RichTextReadOnly initialContent={content} />;
}
```

`EMPTY_EDITOR_DOC` is a blank document seed for new content.

## License

MIT
