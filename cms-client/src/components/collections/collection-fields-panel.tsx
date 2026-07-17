import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import {
  useCollectionFields,
  useCreateCollectionField,
  useDeleteCollectionField,
  useUpdateCollectionField,
  type CollectionFieldInput,
} from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CollectionFieldRecord,
  type CollectionFieldType,
} from "@/lib/cms-api";

export const COLLECTION_FIELD_TYPE_OPTIONS: {
  value: CollectionFieldType;
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "long-text", label: "Long text" },
  { value: "richtext", label: "Rich text" },
  { value: "diagrams", label: "Diagrams" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "bool", label: "Boolean" },
];

const fieldTypeLabel = (fieldType: CollectionFieldType) =>
  COLLECTION_FIELD_TYPE_OPTIONS.find((option) => option.value === fieldType)
    ?.label ?? fieldType;

type FieldDraft = CollectionFieldInput;

const emptyDraft = (): FieldDraft => ({
  key: "",
  label: "",
  fieldType: "text",
  required: false,
});

type CollectionFieldsPanelProps = {
  collectionId: number;
};

function FieldEditor({
  draft,
  submitLabel,
  disabled,
  autoKeyFromLabel,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: FieldDraft;
  submitLabel: string;
  disabled: boolean;
  autoKeyFromLabel: boolean;
  onChange: (draft: FieldDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const id = useId();
  const [keyTouched, setKeyTouched] = useState(!autoKeyFromLabel);

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-label`}>Label</Label>
          <Input
            id={`${id}-label`}
            placeholder="Title"
            value={draft.label}
            onChange={(e) => {
              const label = e.target.value;
              const next = { ...draft, label };
              if (autoKeyFromLabel && !keyTouched) {
                next.key = slugify(label);
              }
              onChange(next);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-key`}>Key</Label>
          <Input
            id={`${id}-key`}
            placeholder="title"
            value={draft.key}
            onChange={(e) => {
              setKeyTouched(true);
              onChange({ ...draft, key: e.target.value });
            }}
          />
          <p className="text-xs text-muted-foreground">
            {autoKeyFromLabel
              ? "Auto-generated from label. Mostly for API clients."
              : "Mostly for API clients."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-type`}>Type</Label>
          <Select
            value={draft.fieldType}
            onValueChange={(value) =>
              onChange({ ...draft, fieldType: value as CollectionFieldType })
            }
          >
            <SelectTrigger id={`${id}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_FIELD_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox
            id={`${id}-required`}
            checked={draft.required}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onChange({ ...draft, required: checked === true })
            }
          />
          <Label htmlFor={`${id}-required`} className="font-normal">
            Required
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={disabled} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="ghost" disabled={disabled} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CollectionFieldsPanel({
  collectionId,
}: CollectionFieldsPanelProps) {
  const fieldsQuery = useCollectionFields(collectionId);
  const createField = useCreateCollectionField(collectionId);
  const updateField = useUpdateCollectionField(collectionId);
  const deleteField = useDeleteCollectionField(collectionId);

  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<FieldDraft>(emptyDraft);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<FieldDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const fields = fieldsQuery.data ?? [];
  const loading = fieldsQuery.isPending;

  const startEdit = (field: CollectionFieldRecord) => {
    setEditingFieldId(field.id);
    setEditDraft({
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
    });
    setShowCreate(false);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      await createField.mutateAsync(createDraft);
      setShowCreate(false);
      setCreateDraft(emptyDraft());
      toast.success("Field added.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add field";
      setError(message);
      toast.error(message);
      throw e;
    }
  };

  const handleUpdate = async (fieldId: number) => {
    setError(null);
    try {
      await updateField.mutateAsync({ fieldId, ...editDraft });
      setEditingFieldId(null);
      toast.success("Field saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save field";
      setError(message);
      toast.error(message);
      throw e;
    }
  };

  const handleDelete = async (fieldId: number) => {
    setError(null);
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success("Field deleted.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete field";
      setError(message);
      toast.error(message);
    }
  };

  const queryError =
    fieldsQuery.error instanceof Error
      ? fieldsQuery.error.message
      : fieldsQuery.error
        ? "Failed to load fields"
        : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading fields…"
            : fields.length === 0
              ? "Add fields to define this collection's schema."
              : `${fields.length} field${fields.length === 1 ? "" : "s"}`}
        </p>
        {!showCreate ? (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => {
              setShowCreate(true);
              setEditingFieldId(null);
              setCreateDraft(emptyDraft());
            }}
          >
            Add field
          </Button>
        ) : null}
      </div>

      {error || queryError ? (
        <p className="text-sm text-destructive">{error ?? queryError}</p>
      ) : null}

      {showCreate ? (
        <FieldEditor
          draft={createDraft}
          submitLabel={createField.isPending ? "Adding…" : "Add field"}
          disabled={createField.isPending}
          autoKeyFromLabel
          onChange={setCreateDraft}
          onSubmit={() => {
            void handleCreate();
          }}
          onCancel={() => {
            setShowCreate(false);
            setCreateDraft(emptyDraft());
          }}
        />
      ) : null}

      {!loading && fields.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No fields yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field) =>
            editingFieldId === field.id ? (
              <FieldEditor
                key={field.id}
                draft={editDraft}
                submitLabel={
                  updateField.isPending &&
                  updateField.variables?.fieldId === field.id
                    ? "Saving…"
                    : "Save field"
                }
                disabled={
                  updateField.isPending &&
                  updateField.variables?.fieldId === field.id
                }
                autoKeyFromLabel={false}
                onChange={setEditDraft}
                onSubmit={() => {
                  void handleUpdate(field.id);
                }}
                onCancel={() => setEditingFieldId(null)}
              />
            ) : (
              <div
                key={field.id}
                className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{field.key}</span>
                    {" · "}
                    {fieldTypeLabel(field.fieldType)}
                    {field.required ? " · required" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      deleteField.isPending &&
                      deleteField.variables === field.id
                    }
                    onClick={() => startEdit(field)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      deleteField.isPending &&
                      deleteField.variables === field.id
                    }
                    onClick={() => void handleDelete(field.id)}
                  >
                    {deleteField.isPending &&
                    deleteField.variables === field.id
                      ? "Deleting…"
                      : "Delete"}
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
