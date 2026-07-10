import * as React from "react";
import { Select } from "radix-ui";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";

const NodeViewContentAsCode = NodeViewContent as React.ComponentType<{
  as: "code";
}>;

const itemClassName =
  "cursor-default rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

const CodeBlockComponent: React.FC<NodeViewProps> = ({
  editor,
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}) => {
  const handleLanguageChange = (value: string) => {
    updateAttributes({
      language: value,
    });
  };

  const languageLabel =
    defaultLanguage && String(defaultLanguage) !== "null"
      ? String(defaultLanguage)
      : "auto";

  if (!editor.isEditable) {
    return (
      <NodeViewWrapper className="code-block" data-testid="code-block-node">
        <span className="mb-1 block text-sm text-muted-foreground">
          {languageLabel}
        </span>
        <pre>
          <NodeViewContentAsCode as="code" />
        </pre>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="code-block" data-testid="code-block-node">
      <Select.Root
        value={defaultLanguage}
        onValueChange={handleLanguageChange}
      >
        <Select.Trigger
          className="mb-1 inline-flex h-8 w-44 items-center justify-between gap-2 rounded border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          contentEditable={false}
        >
          <Select.Value placeholder="Language" />
          <Select.Icon className="text-muted-foreground">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="z-50 max-h-64 overflow-hidden rounded border border-border bg-popover text-popover-foreground shadow-md"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              <Select.Item value="null" className={itemClassName}>
                <Select.ItemText>auto</Select.ItemText>
              </Select.Item>
              {extension.options.lowlight.listLanguages().map((lang: string) => (
                <Select.Item key={lang} value={lang} className={itemClassName}>
                  <Select.ItemText>{lang}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <pre>
        <NodeViewContentAsCode as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;
