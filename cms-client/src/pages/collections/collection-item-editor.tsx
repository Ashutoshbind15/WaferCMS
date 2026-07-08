import { useState } from "react";
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

const buildInitialValues = (
  fields: CollectionFieldRecord[],
  itemValues?: Record<string, unknown>,
): Record<string, unknown> => {
  const base = emptyValues(fields);
  if (!itemValues) {
    return base;
  }

  const merged = { ...base, ...itemValues };
  for (const field of fields) {
    if (merged[field.key] == null) {
      merged[field.key] = base[field.key];
    }
  }
  return merged;
};

type CollectionItemFormProps = {
  collectionId: number;
  itemId?: number;
  fields: CollectionFieldRecord[];
  initialValues: Record<string, unknown>;
  pageTitle: string;
  onBack: () => void;
};

function CollectionItemForm({
  collectionId,
  itemId,
  fields,
  initialValues,
  pageTitle,
  onBack,
}: CollectionItemFormProps) {
  const navigate = useNavigate();
  const isEditing = itemId != null;
  const createItem = useCreateCollectionItem(collectionId);
  const updateItem = useUpdateCollectionItem(collectionId, itemId ?? 0);

  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    valuesSnapshot(initialValues),
  );
  const [error, setError] = useState<string | null>(null);

  const saving = createItem.isPending || updateItem.isPending;
  const dirty = valuesSnapshot(values) !== savedSnapshot;

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (isEditing) {
        await updateItem.mutateAsync({ values });
        setSavedSnapshot(valuesSnapshot(values));
        toast.success("Item saved.");
      } else {
        const created = await createItem.mutateAsync({ values });
        toast.success("Item created.");
        navigate(`/collections/${collectionId}/items/${created.id}`, {
          replace: true,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save item";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <Header
        title={pageTitle}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
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
              disabled={saving || fields.length === 0 || !dirty}
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

        <div className="mx-auto max-w-3xl space-y-4">
          <CollectionItemFieldEditors
            fields={fields}
            values={values}
            onChange={handleChange}
          />
        </div>
      </PageContainer>
    </>
  );
}

export default function CollectionItemEditorPage() {
  const navigate = useNavigate();
  const { id, itemId } = useParams();
  const collectionId = Number(id);
  const isEditing = Boolean(itemId);
  const numericItemId = Number(itemId);

  const collectionQuery = useCollection(collectionId);
  const fieldsQuery = useCollectionFields(collectionId);
  const itemQuery = useCollectionItem(collectionId, numericItemId);

  const record = collectionQuery.data ?? null;
  const fields = fieldsQuery.data ?? [];
  const queriesLoading =
    collectionQuery.isPending ||
    fieldsQuery.isPending ||
    (isEditing && itemQuery.isPending);

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
  const fullTitle = record ? `${record.title} · ${pageTitle}` : pageTitle;
  const onBack = () =>
    navigate(`/collections/${collectionId}`, { state: { tab: "items" } });

  if (queriesLoading) {
    return (
      <>
        <Header
          title={fullTitle}
          action={
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          }
        />
        <PageContainer>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </PageContainer>
      </>
    );
  }

  if (queryError) {
    return (
      <>
        <Header
          title={fullTitle}
          action={
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          }
        />
        <PageContainer>
          <p className="text-sm text-destructive">{queryError}</p>
        </PageContainer>
      </>
    );
  }

  if (fields.length === 0) {
    return (
      <>
        <Header
          title={fullTitle}
          action={
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          }
        />
        <PageContainer>
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              This collection has no fields defined. Add fields before creating
              items.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  const formKey = isEditing ? `item-${itemId}` : `new-${collectionId}`;
  const initialValues = buildInitialValues(
    fields,
    isEditing ? itemQuery.data?.values : undefined,
  );

  return (
    <CollectionItemForm
      key={formKey}
      collectionId={collectionId}
      itemId={isEditing ? numericItemId : undefined}
      fields={fields}
      initialValues={initialValues}
      pageTitle={fullTitle}
      onBack={onBack}
    />
  );
}
