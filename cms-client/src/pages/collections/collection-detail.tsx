import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CollectionFieldsPanel } from "@/components/collections/collection-fields-panel";
import { CollectionMetadataDialog } from "@/components/collections/collection-metadata-dialog";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  createCollectionField,
  deleteCollectionField,
  fetchCollection,
  fetchCollectionFields,
  updateCollection,
  updateCollectionField,
  type CollectionFieldRecord,
  type CollectionRecord,
} from "@/lib/cms-api";
import { ArrowLeft, List, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const collectionId = Number(id);

  const [record, setRecord] = useState<CollectionRecord | null>(null);
  const [fields, setFields] = useState<CollectionFieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savingFieldId, setSavingFieldId] = useState<number | "new" | null>(
    null,
  );
  const [deletingFieldId, setDeletingFieldId] = useState<number | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveMetadata = async (input: {
    slug: string;
    title: string;
    description: string;
  }) => {
    setMetadataSaving(true);
    setMetadataError(null);
    try {
      const updated = await updateCollection(collectionId, {
        slug: input.slug,
        title: input.title,
        description: input.description || null,
      });
      setRecord(updated);
      toast.success("Collection updated.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to save collection";
      setMetadataError(message);
      toast.error(message);
      throw e;
    } finally {
      setMetadataSaving(false);
    }
  };

  const reloadFields = async () => {
    setFields(await fetchCollectionFields(collectionId));
  };

  const handleCreateField = async (input: {
    key: string;
    label: string;
    fieldType: CollectionFieldRecord["fieldType"];
    required: boolean;
  }) => {
    setSavingFieldId("new");
    setFieldError(null);
    try {
      await createCollectionField(collectionId, input);
      await reloadFields();
      toast.success("Field added.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add field";
      setFieldError(message);
      toast.error(message);
      throw e;
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleUpdateField = async (
    fieldId: number,
    input: {
      key: string;
      label: string;
      fieldType: CollectionFieldRecord["fieldType"];
      required: boolean;
    },
  ) => {
    setSavingFieldId(fieldId);
    setFieldError(null);
    try {
      await updateCollectionField(collectionId, fieldId, input);
      await reloadFields();
      toast.success("Field saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save field";
      setFieldError(message);
      toast.error(message);
      throw e;
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    setDeletingFieldId(fieldId);
    setFieldError(null);
    try {
      await deleteCollectionField(collectionId, fieldId);
      await reloadFields();
      toast.success("Field deleted.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete field";
      setFieldError(message);
      toast.error(message);
    } finally {
      setDeletingFieldId(null);
    }
  };

  return (
    <>
      <Header
        title={record?.title ?? "Collection"}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/collections")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !record}
              onClick={() => navigate(`/collections/${collectionId}/items`)}
            >
              <List className="mr-1 h-4 w-4" />
              Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !record}
              onClick={() => {
                setMetadataError(null);
                setMetadataOpen(true);
              }}
            >
              <Settings2 className="mr-1 h-4 w-4" />
              Settings
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
        ) : record ? (
          <div className="mx-auto max-w-3xl space-y-6">
            {record.description ? (
              <p className="text-sm text-muted-foreground">
                {record.description}
              </p>
            ) : null}

            <CollectionFieldsPanel
              fields={fields}
              savingFieldId={savingFieldId}
              deletingFieldId={deletingFieldId}
              error={fieldError}
              onCreate={handleCreateField}
              onUpdate={handleUpdateField}
              onDelete={handleDeleteField}
            />
          </div>
        ) : null}
      </PageContainer>

      <CollectionMetadataDialog
        open={metadataOpen}
        record={record}
        saving={metadataSaving}
        error={metadataError}
        onOpenChange={setMetadataOpen}
        onSave={handleSaveMetadata}
      />
    </>
  );
}
