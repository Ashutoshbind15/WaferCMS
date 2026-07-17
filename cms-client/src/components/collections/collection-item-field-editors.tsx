import { lazy, Suspense, useCallback, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  EMPTY_EDITOR_DOC,
  type RichTextContent,
} from "@/components/editor/rich-text-document";
import { loadRichTextEditor } from "@/components/editor/rich-text-editor-loader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { DiagramCanvas } from "@scribblesvg/react-utils/editor";
import { EMPTY_DOCUMENT, type DiagramDocument } from "@scribblesvg/core";
import type { CollectionFieldRecord } from "@/lib/cms-api";

const RichTextEditor = lazy(loadRichTextEditor);

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

const parseDateValue = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || !DATE_VALUE_PATTERN.test(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateValue = (date: Date): string => format(date, "yyyy-MM-dd");

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
    case "bool":
      return false;
    default:
      return null;
  }
};

type FieldInputProps = {
  field: CollectionFieldRecord;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
};

function DateFieldInput({
  value,
  onChange,
  readOnly = false,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}) {
  const selected = parseDateValue(value);

  if (readOnly) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-start text-left font-normal"
      >
        <CalendarIcon data-icon="inline-start" />
        {selected ? format(selected, "PPP") : <span>No date</span>}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className={cn(
            "w-full justify-start text-left font-normal",
            "data-[empty=true]:text-muted-foreground",
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          onSelect={(date) => onChange(date ? formatDateValue(date) : null)}
        />
      </PopoverContent>
    </Popover>
  );
}

function FieldInput({ field, value, onChange, readOnly = false }: FieldInputProps) {
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
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "long-text":
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={typeof value === "number" ? value : ""}
          readOnly={readOnly}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "") {
              onChange(null);
              return;
            }
            const parsed = Number(next);
            onChange(Number.isFinite(parsed) ? parsed : null);
          }}
        />
      );
    case "date":
      return (
        <DateFieldInput
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "bool":
      return (
        <Toggle
          variant="outline"
          pressed={value === true}
          disabled={readOnly}
          onPressedChange={(pressed) => onChange(pressed)}
          aria-label={field.label}
        >
          {value === true ? "Yes" : "No"}
        </Toggle>
      );
    case "richtext":
      return (
        <div className="rounded-lg border border-border bg-card">
          <Suspense fallback={<RichTextEditorFallback />}>
            <RichTextEditor
              initialContent={asRichText(value)}
              isEditable={!readOnly}
              onChange={
                readOnly
                  ? undefined
                  : (stableOnChange as (content: RichTextContent) => void)
              }
            />
          </Suspense>
        </div>
      );
    case "diagrams":
      return (
        <div
          className={`h-[28rem] overflow-hidden rounded-lg border border-border ${
            readOnly ? "pointer-events-none" : ""
          }`}
        >
          <DiagramCanvas
            initialDocument={asDiagram(value)}
            onChange={
              readOnly
                ? () => {}
                : (stableOnChange as (doc: DiagramDocument) => void)
            }
          />
        </div>
      );
  }
}

type CollectionItemFieldEditorsProps = {
  fields: CollectionFieldRecord[];
  values: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
};

export function CollectionItemFieldEditors({
  fields,
  values,
  onChange,
  readOnly = false,
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
            readOnly={readOnly}
            onChange={(v) => onChange?.(field.key, v)}
          />
        </div>
      ))}
    </div>
  );
}
