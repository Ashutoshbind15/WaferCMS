import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CollectionItemFieldEditors,
  emptyValueForField,
} from "@/components/collections/collection-item-field-editors";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  useCollection,
  useCollectionFields,
  useCollectionItem,
  useCreateCollectionItem,
  useUpdateCollectionItem,
} from "@/lib/queries";
import { type CollectionFieldRecord } from "@/lib/cms-api";
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
  const numericItemId = Number(itemId);

  const collectionQuery = useCollection(collectionId);
  const fieldsQuery = useCollectionFields(collectionId);
  const itemQuery = useCollectionItem(collectionId, numericItemId);
  const createItem = useCreateCollectionItem(collectionId);
  const updateItem = useUpdateCollectionItem(collectionId, numericItemId);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(valuesSnapshot({}));
  const [hydrated, setHydrated] = useState(false);

  const record = collectionQuery.data ?? null;
  const fields = fieldsQuery.data ?? [];
  const loading =
    collectionQuery.isPending ||
    fieldsQuery.isPending ||
    (isEditing && itemQuery.isPending);

  useEffect(() => {
    if (loading || fields.length === 0) {
      return;
    }

    if (isEditing && itemQuery.data) {
      const base = emptyValues(fields);
      const merged = { ...base, ...itemQuery.data.values };
      for (const field of fields) {
        if (merged[field.key] == null) {
          merged[field.key] = base[field.key];
        }
      }
      setValues(merged);
      setSavedSnapshot(valuesSnapshot(merged));
      setHydrated(true);
      return;
    }

    if (!isEditing) {
      const nextValues = emptyValues(fields);
      setValues(nextValues);
      setSavedSnapshot(valuesSnapshot(nextValues));
      setHydrated(true);
    }
  }, [loading, fields, isEditing, itemQuery.data]);

  const dirty = useMemo(
    () => hydrated && valuesSnapshot(values) !== savedSnapshot,
    [hydrated, values, savedSnapshot],
  );

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (isEditing && itemId) {
        await updateItem.mutateAsync({ values });
        setSavedSnapshot(valuesSnapshot(values));
        toast.success("Item saved.");
      } else {
        const created = await createItem.mutateAsync({ values });
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
    }
  };

  const queryError =
    !Number.isInteger(collectionId) || collectionId <= 0
      ? "Invalid collection id."
      : collectionQuery.error instanceof Error
        ? collectionQuery.error.message
        : fieldsQuery.error instanceof Error
          ? fieldsQuery.error.message
          : itemQuery.error instanceof Error
            ? itemQuery.error.message
            : collectionQuery.error ||
                fieldsQuery.error ||
                (isEditing && itemQuery.error)
              ? "Failed to load item"
              : null;

  const pageTitle = isEditing ? "Edit item" : "New item";
  const itemKey = isEditing ? `item-${itemId}` : "new";
  const saving = createItem.isPending || updateItem.isPending;

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
        {error || queryError ? (
          <p className="mb-4 text-sm text-destructive">{error ?? queryError}</p>
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
