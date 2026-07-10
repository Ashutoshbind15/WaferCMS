import * as React from "react";
import { Select } from "radix-ui";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import "./styles.css";

const NodeViewContentAsCode = NodeViewContent as React.ComponentType<{
  as: "code";
}>;

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
      <NodeViewWrapper className="wafer-code-block" data-testid="code-block-node">
        <span className="wafer-code-block__label">{languageLabel}</span>
        <pre>
          <NodeViewContentAsCode as="code" />
        </pre>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="wafer-code-block" data-testid="code-block-node">
      <Select.Root
        value={defaultLanguage}
        onValueChange={handleLanguageChange}
      >
        <Select.Trigger
          className="wafer-code-block__trigger"
          contentEditable={false}
        >
          <Select.Value placeholder="Language" />
          <Select.Icon className="wafer-code-block__trigger-icon">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="wafer-code-block__content"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="wafer-code-block__viewport">
              <Select.Item value="null" className="wafer-code-block__item">
                <Select.ItemText>auto</Select.ItemText>
              </Select.Item>
              {extension.options.lowlight.listLanguages().map((lang: string) => (
                <Select.Item
                  key={lang}
                  value={lang}
                  className="wafer-code-block__item"
                >
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
