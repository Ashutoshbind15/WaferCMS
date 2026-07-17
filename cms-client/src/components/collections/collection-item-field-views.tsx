import { EditorContent, useEditor } from "@tiptap/react";
import { format } from "date-fns";
import { richTextExtensions } from "@wafercms/rich-text";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { DiagramRenderer } from "@scribblesvg/react-utils/renderer";
import { EMPTY_DOCUMENT, type DiagramDocument } from "@scribblesvg/core";
import type { CollectionFieldRecord } from "@/lib/cms-api";

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateValue = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || !DATE_VALUE_PATTERN.test(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const asRichText = (value: unknown): RichTextContent =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RichTextContent)
    : EMPTY_EDITOR_DOC;

const asDiagram = (value: unknown): DiagramDocument =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as DiagramDocument)
    : EMPTY_DOCUMENT;

function RichTextFieldView({ value }: { value: unknown }) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content: asRichText(value),
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-base max-w-none focus:outline-none",
      },
    },
  });

  return <EditorContent editor={editor} />;
}

type FieldViewProps = {
  field: CollectionFieldRecord;
  value: unknown;
};

function FieldView({ field, value }: FieldViewProps) {
  switch (field.fieldType) {
    case "text": {
      const text = typeof value === "string" ? value : "";
      if (!text) {
        return <p className="text-sm text-muted-foreground">—</p>;
      }
      return <p className="text-xl font-medium tracking-tight">{text}</p>;
    }
    case "long-text": {
      const text = typeof value === "string" ? value : "";
      if (!text) {
        return <p className="text-sm text-muted-foreground">—</p>;
      }
      return (
        <div className="prose prose-base max-w-none whitespace-pre-wrap text-foreground">
          {text}
        </div>
      );
    }
    case "richtext":
      return (
        <div className="rounded-xl border border-border/60 bg-card/40 px-6 py-5">
          <RichTextFieldView value={value} />
        </div>
      );
    case "diagrams":
      return (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/20 p-4">
          <DiagramRenderer document={asDiagram(value)} className="w-full" />
        </div>
      );
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return <p className="text-sm text-muted-foreground">—</p>;
      }
      return <p className="text-xl font-medium tracking-tight">{value}</p>;
    }
    case "date": {
      const date = parseDateValue(value);
      if (!date) {
        return <p className="text-sm text-muted-foreground">—</p>;
      }
      return (
        <p className="text-xl font-medium tracking-tight">
          {format(date, "PPP")}
        </p>
      );
    }
    case "bool": {
      if (typeof value !== "boolean") {
        return <p className="text-sm text-muted-foreground">—</p>;
      }
      return (
        <p className="text-xl font-medium tracking-tight">
          {value ? "Yes" : "No"}
        </p>
      );
    }
  }
}

type CollectionItemFieldViewsProps = {
  fields: CollectionFieldRecord[];
  values: Record<string, unknown>;
};

export function CollectionItemFieldViews({
  fields,
  values,
}: CollectionItemFieldViewsProps) {
  return (
    <div className="space-y-10">
      {fields.map((field) => (
        <div key={field.id} className="space-y-3">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {field.label}
            {field.required ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
          </p>
          <FieldView field={field} value={values[field.key]} />
        </div>
      ))}
    </div>
  );
}
