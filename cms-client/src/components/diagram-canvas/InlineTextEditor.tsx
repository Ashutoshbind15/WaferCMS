import { useEffect, useRef, useCallback } from "react";

/**
 * Editing target: which element and what kind of text is being edited.
 */
export interface EditingTarget {
  /** ID of the element being edited */
  elementId: string;
  /** Whether we're editing a standalone text element or a shape's inner label */
  kind: "standalone-text" | "shape-label";
  /** Current text value */
  text: string;
  /** Position and dimensions for the editor overlay (canvas coords) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Font size to match */
  fontSize: number;
}

interface InlineTextEditorProps {
  target: EditingTarget;
  /** Called when editing is committed with the new text value */
  onCommit: (
    elementId: string,
    text: string,
    kind: EditingTarget["kind"],
  ) => void;
  /** Called when editing is cancelled (e.g., Escape with no changes) */
  onCancel: () => void;
}

/** Minimum editor dimensions */
const MIN_WIDTH = 60;
const MIN_HEIGHT = 24;

/**
 * Inline text editor overlay rendered inside the SVG via `<foreignObject>`.
 * - Auto-focuses on mount
 * - Commits on blur or Escape
 * - For shape labels: Enter commits (single-line)
 * - For standalone text: Enter inserts newline, Escape or blur commits
 */
export function InlineTextEditor({
  target,
  onCommit,
  onCancel,
}: InlineTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Small delay so the foreignObject is rendered before focus
    requestAnimationFrame(() => {
      textarea.focus();
      // Select all text for easy replacement
      textarea.select();
    });
  }, []);

  const handleCommit = useCallback(() => {
    const value = textareaRef.current?.value ?? "";
    onCommit(target.elementId, value, target.kind);
  }, [target.elementId, target.kind, onCommit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation(); // Prevent canvas keyboard shortcuts (delete, etc.)

      if (e.key === "Escape") {
        e.preventDefault();
        handleCommit();
        return;
      }

      // For shape labels: Enter commits (single-line)
      if (e.key === "Enter" && target.kind === "shape-label") {
        e.preventDefault();
        handleCommit();
        return;
      }

      // For standalone text: Enter inserts a newline (default textarea behavior)
      // No special handling needed
    },
    [target.kind, handleCommit],
  );

  const handleBlur = useCallback(() => {
    handleCommit();
  }, [handleCommit]);

  // Prevent pointer events from reaching the canvas
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const editorWidth = Math.max(target.width, MIN_WIDTH);
  const editorHeight = Math.max(target.height, MIN_HEIGHT);

  return (
    <foreignObject
      x={target.x}
      y={target.y}
      width={editorWidth}
      height={editorHeight}
      style={{ overflow: "visible" }}
    >
      <textarea
        ref={textareaRef}
        defaultValue={target.text}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPointerDown={handlePointerDown}
        style={{
          width: `${editorWidth}px`,
          height: `${editorHeight}px`,
          minWidth: `${MIN_WIDTH}px`,
          minHeight: `${MIN_HEIGHT}px`,
          fontSize: `${target.fontSize}px`,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          lineHeight: "1.2",
          padding: "0",
          margin: "0",
          border: "2px solid var(--color-primary, #3b82f6)",
          borderRadius: "2px",
          background: "rgba(255, 255, 255, 0.95)",
          color: "inherit",
          outline: "none",
          resize: "both",
          overflow: "auto",
          boxSizing: "border-box",
          // For shape labels, center the text
          textAlign: target.kind === "shape-label" ? "center" : "left",
        }}
      />
    </foreignObject>
  );
}
