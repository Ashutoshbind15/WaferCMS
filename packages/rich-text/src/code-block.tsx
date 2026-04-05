import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";

const NodeViewContentAsCode = NodeViewContent as React.ComponentType<{
  as: "code";
}>;
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "./cn";

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

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
      <SelectPrimitive.Root
        value={defaultLanguage}
        onValueChange={handleLanguageChange}
      >
        <SelectPrimitive.Trigger
          data-slot="select-trigger"
          className={cn(
            "flex w-fit items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground data-[size=default]:h-9 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "w-45",
          )}
          contentEditable={false}
        >
          <SelectPrimitive.Value placeholder="Language" />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-slot="select-content"
            className="relative z-50 max-h-(--radix-select-content-available-height) min-w-36 overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            position="item-aligned"
            align="center"
          >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport className="p-1">
              <SelectPrimitive.Group>
                <SelectPrimitive.Label className="px-2 py-1.5 text-xs text-muted-foreground">
                  Languages
                </SelectPrimitive.Label>
                <SelectPrimitive.Item
                  value="null"
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
                >
                  <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <CheckIcon className="pointer-events-none" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>auto</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
                <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
                {extension.options.lowlight.listLanguages().map((lang: string) => (
                  <SelectPrimitive.Item
                    key={lang}
                    value={lang}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
                  >
                    <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <CheckIcon className="pointer-events-none" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{lang}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      <pre>
        <NodeViewContentAsCode as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;
