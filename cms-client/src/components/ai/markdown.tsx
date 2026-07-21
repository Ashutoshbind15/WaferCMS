import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type MarkdownProps = {
  children: string;
  className?: string;
  isAnimating?: boolean;
};

export function Markdown({
  children,
  className,
  isAnimating = false,
}: MarkdownProps) {
  return (
    <Streamdown
      animated
      isAnimating={isAnimating}
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-current",
        "prose-p:my-2 prose-p:leading-relaxed first:prose-p:mt-0 last:prose-p:mb-0",
        "prose-headings:my-2 prose-headings:font-medium prose-headings:text-current",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
        "prose-pre:my-2 prose-pre:rounded-lg prose-pre:bg-background/60",
        "prose-code:rounded prose-code:bg-background/60 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        "prose-a:text-current prose-a:underline prose-a:underline-offset-2",
        "prose-strong:text-current prose-strong:font-semibold",
        className,
      )}
    >
      {children}
    </Streamdown>
  );
}
