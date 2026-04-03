import React from "react";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CodeBlockComponent: React.FC<NodeViewProps> = ({
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

  return (
    <NodeViewWrapper className="code-block" data-testid="code-block-node">
      <Select value={defaultLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-45" contentEditable={false}>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value="null">auto</SelectItem>
            <SelectSeparator />
            {extension.options.lowlight.listLanguages().map((lang: string) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;
