import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CollectionItemFieldEditors,
  emptyValueForField,
} from "@/components/collections/collection-item-field-editors";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  createCollectionItem,
  fetchCollection,
  fetchCollectionFields,
  fetchCollectionItem,
  updateCollectionItem,
  type CollectionFieldRecord,
  type CollectionRecord,
} from "@/lib/cms-api";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const valuesSnapshot = (values: Record<string, unknown>) =>
  JSON.stringify(values);

const emptyValues = (fields: CollectionFieldRecord[]): Record<string, unknown> =>
  Object.fromEntries(fields.map((field) => [field.key, emptyValueForField(field)]));

export default function CollectionItemEditorPage() {
  const navigate = useNavigate();
  const { id, itemId } = useParams();
  const collectionId = Number(id);
  const isEditing = Boolean(itemId);

  const [record, setRecord] = useState<CollectionRecord | null>(null);
  const [fields, setFields] = useState<CollectionFieldRecord[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    valuesSnapshot({}),
  );

  const load = useCallback(async () => {
    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      setError("Invalid collection id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [collection, nextFields] = await Promise.all([
        fetchCollection(collectionId),
        fetchCollectionFields(collectionId),
      ]);
      setRecord(collection);
      setFields(nextFields);

      if (isEditing && itemId) {
        const item = await fetchCollectionItem(collectionId, Number(itemId));
        const base = emptyValues(nextFields);
        const merged = { ...base, ...item.values };
        // Normalize stored nulls back to field defaults so that uncontrolled
        // editor components (DiagramCanvas, RichTextEditor) don't diverge from
        // savedSnapshot on mount and incorrectly mark the form dirty.
        for (const field of nextFields) {
          if (merged[field.key] == null) {
            merged[field.key] = base[field.key];
          }
        }
        setValues(merged);
        setSavedSnapshot(valuesSnapshot(merged));
      } else {
        const nextValues = emptyValues(nextFields);
        setValues(nextValues);
        setSavedSnapshot(valuesSnapshot(nextValues));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load item");
    } finally {
      setLoading(false);
    }
  }, [collectionId, isEditing, itemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => !loading && valuesSnapshot(values) !== savedSnapshot,
    [loading, values, savedSnapshot],
  );

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isEditing && itemId) {
        const updated = await updateCollectionItem(
          collectionId,
          Number(itemId),
          { values },
        );
        const base = emptyValues(fields);
        const nextValues = { ...base, ...updated.values };
        for (const field of fields) {
          if (nextValues[field.key] == null) nextValues[field.key] = base[field.key];
        }
        setValues(nextValues);
        setSavedSnapshot(valuesSnapshot(nextValues));
        toast.success("Item saved.");
      } else {
        const created = await createCollectionItem(collectionId, { values });
        toast.success("Item created.");
        navigate(
          `/collections/${collectionId}/items/${created.id}`,
          { replace: true },
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save item";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEditing ? "Edit item" : "New item";
  const itemKey = isEditing ? `item-${itemId}` : "new";

  return (
    <>
      <Header
        title={record ? `${record.title} · ${pageTitle}` : pageTitle}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/collections/${collectionId}/items`)
              }
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {dirty ? (
              <span
                className="inline-flex items-center"
                title="Unsaved changes"
              >
                <span className="sr-only">Unsaved changes</span>
                <span
                  aria-hidden
                  className="size-2.5 rounded-full bg-amber-500"
                />
              </span>
            ) : null}
            <Button
              size="sm"
              disabled={saving || loading || fields.length === 0 || !dirty}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />
      <PageContainer>
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <CollectionItemFieldEditors
              fields={fields}
              values={values}
              itemKey={itemKey}
              onChange={handleChange}
            />
          </div>
        )}
      </PageContainer>
    </>
  );
}
