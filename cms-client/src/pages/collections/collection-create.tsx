import { useState } from "react";
import { useNavigate } from "react-router";
import { CollectionForm } from "@/components/forms/collection-form";
import { useCreateCollection } from "@/lib/queries";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const collectionSnapshot = (input: {
  slug: string;
  title: string;
  description: string;
}) => JSON.stringify(input);

const EMPTY_SNAPSHOT = collectionSnapshot({
  slug: "",
  title: "",
  description: "",
});

export default function CollectionCreatePage() {
  const navigate = useNavigate();
  const createCollection = useCreateCollection();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    collectionSnapshot({ slug, title, description }) !== EMPTY_SNAPSHOT;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSave = async () => {
    setError(null);

    try {
      const created = await createCollection.mutateAsync({
        slug,
        title,
        description: description || null,
      });
      toast.success("Collection created.");
      navigate(`/collections/${created.id}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create collection";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <CollectionForm
      pageTitle="New collection"
      slug={slug}
      title={title}
      description={description}
      loading={false}
      saving={createCollection.isPending}
      dirty={dirty}
      error={error}
      onBack={() => navigate("/collections")}
      onSave={handleSave}
      onSlugChange={(value) => {
        setSlugTouched(true);
        setSlug(value);
      }}
      onTitleChange={handleTitleChange}
      onDescriptionChange={setDescription}
    />
  );
}
