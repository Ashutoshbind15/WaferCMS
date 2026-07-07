import { lazy, Suspense, useCallback, useRef } from "react";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { loadRichTextEditor } from "@/components/editor/rich-text-editor-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DiagramCanvas } from "@scribblesvg/react-utils/editor";
import { EMPTY_DOCUMENT, type DiagramDocument } from "@scribblesvg/core";
import type { CollectionFieldRecord } from "@/lib/cms-api";

const RichTextEditor = lazy(loadRichTextEditor);

function RichTextEditorFallback() {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const asRichText = (value: unknown): RichTextContent =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RichTextContent)
    : EMPTY_EDITOR_DOC;

const asDiagram = (value: unknown): DiagramDocument =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as DiagramDocument)
    : EMPTY_DOCUMENT;

/**
 * Returns the appropriate empty/default value for a field type. Used to
 * initialise new items and normalise null values from the DB so that
 * uncontrolled editor components (DiagramCanvas, RichTextEditor) don't
 * immediately mark the form as dirty on mount.
 */
export const emptyValueForField = (field: CollectionFieldRecord): unknown => {
  switch (field.fieldType) {
    case "diagrams":
      return EMPTY_DOCUMENT;
    case "richtext":
      return EMPTY_EDITOR_DOC;
    default:
      return null;
  }
};

type FieldInputProps = {
  field: CollectionFieldRecord;
  value: unknown;
  onChange: (value: unknown) => void;
};

function FieldInput({ field, value, onChange }: FieldInputProps) {
  // Keep a ref to the latest onChange so the stable callbacks below never
  // need to be recreated. DiagramCanvas and RichTextEditor both have a
  // useEffect([..., onChange]) that re-fires whenever the callback reference
  // changes, which would cause an infinite re-render loop if we passed an
  // inline arrow function.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stableOnChange = useCallback((v: unknown) => {
    onChangeRef.current(v);
  }, []);

  switch (field.fieldType) {
    case "text":
      return (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "long-text":
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "richtext":
      return (
        <div className="rounded-lg border border-border bg-card">
          <Suspense fallback={<RichTextEditorFallback />}>
            <RichTextEditor
              initialContent={asRichText(value)}
              isEditable
              onChange={stableOnChange as (content: RichTextContent) => void}
            />
          </Suspense>
        </div>
      );
    case "diagrams":
      return (
        <div className="h-[28rem] overflow-hidden rounded-lg border border-border">
          <DiagramCanvas
            initialDocument={asDiagram(value)}
            onChange={stableOnChange as (doc: DiagramDocument) => void}
          />
        </div>
      );
  }
}

type CollectionItemFieldEditorsProps = {
  fields: CollectionFieldRecord[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export function CollectionItemFieldEditors({
  fields,
  values,
  onChange,
}: CollectionItemFieldEditorsProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.label}
            {field.required ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
          </Label>
          <FieldInput
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        </div>
      ))}
    </div>
  );
}
