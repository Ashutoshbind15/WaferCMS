import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createApiKey,
  createCollection,
  createCollectionField,
  createCollectionItem,
  createUser,
  deleteCollection,
  deleteCollectionField,
  deleteCollectionItem,
  disableUser,
  fetchApiKeys,
  fetchCollection,
  fetchCollectionBySlug,
  fetchCollectionFields,
  fetchCollectionItem,
  fetchCollectionItems,
  fetchCollectionList,
  fetchLibraryFile,
  fetchLibraryFiles,
  fetchUsers,
  patchLibraryFile,
  revokeApiKey,
  updateCollection,
  updateCollectionField,
  updateCollectionItem,
  type ApiKeyScope,
  type CollectionFieldType,
} from "@/lib/cms-api";

export const cmsQueryKeys = {
  files: (page: number) => ["cms", "files", { page }] as const,
  file: (id: number) => ["cms", "files", "meta", id] as const,
  collections: (page: number) => ["cms", "collections", { page }] as const,
  collection: (id: number) => ["cms", "collections", id] as const,
  collectionBySlug: (slug: string) => ["cms", "collections", "slug", slug] as const,
  collectionFields: (id: number) =>
    ["cms", "collections", id, "fields"] as const,
  collectionItems: (id: number, page: number) =>
    ["cms", "collections", id, "items", { page }] as const,
  collectionItem: (collectionId: number, itemId: number) =>
    ["cms", "collections", collectionId, "items", itemId] as const,
  apiKeys: ["cms", "api-keys"] as const,
  users: ["cms", "users"] as const,
};

const validId = (id: number) => Number.isInteger(id) && id > 0;

export function useCollectionBySlug(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.collectionBySlug(slug),
    queryFn: () => fetchCollectionBySlug(slug),
    enabled: slug.trim().length > 0,
  });
}

export function useLibraryFiles(page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.files(page),
    queryFn: () => fetchLibraryFiles({ page, count: true }),
  });
}

export function useLibraryFile(id: number | null) {
  return useQuery({
    queryKey: cmsQueryKeys.file(id ?? 0),
    queryFn: () => fetchLibraryFile(id!),
    enabled: id != null && validId(id),
  });
}

export function usePatchLibraryFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; isPublic: boolean }) =>
      patchLibraryFile(input.id, { isPublic: input.isPublic }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "files"] });
    },
  });
}

export function useCollectionList(page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collections(page),
    queryFn: () => fetchCollectionList({ page, count: true }),
  });
}

/** Most-recently-touched collections (page 1 is ordered by updatedAt desc). */
export function useRecentCollections(limit = 5) {
  return useQuery({
    queryKey: ["cms", "collections", "recent", { limit }] as const,
    queryFn: () => fetchCollectionList({ page: 1, limit, count: false }),
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collection(id),
    queryFn: () => fetchCollection(id),
    enabled: validId(id),
  });
}

export function useCollectionFields(collectionId: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collectionFields(collectionId),
    queryFn: () => fetchCollectionFields(collectionId),
    enabled: validId(collectionId),
  });
}

export function useCollectionItems(collectionId: number, page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collectionItems(collectionId, page),
    queryFn: () =>
      fetchCollectionItems(collectionId, {
        page,
        count: true,
        includeDrafts: true,
      }),
    enabled: validId(collectionId),
  });
}

export function useInfiniteCollectionItems(collectionId: number) {
  return useInfiniteQuery({
    queryKey: ["cms", "collections", collectionId, "items", "infinite"] as const,
    queryFn: ({ pageParam }) =>
      fetchCollectionItems(collectionId, {
        page: pageParam,
        count: true,
        includeDrafts: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: validId(collectionId),
  });
}

export function useCollectionItem(collectionId: number, itemId: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collectionItem(collectionId, itemId),
    queryFn: () =>
      fetchCollectionItem(collectionId, itemId, { includeDrafts: true }),
    enabled: validId(collectionId) && validId(itemId),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
    },
  });
}

export function useUpdateCollection(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      slug: string;
      title: string;
      description?: string | null;
    }) => updateCollection(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.collection(id),
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
    },
  });
}

export type CollectionFieldInput = {
  key: string;
  label: string;
  fieldType: CollectionFieldType;
  required: boolean;
};

export function useCreateCollectionField(collectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CollectionFieldInput) =>
      createCollectionField(collectionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.collectionFields(collectionId),
      });
    },
  });
}

export function useUpdateCollectionField(collectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CollectionFieldInput & { fieldId: number }) =>
      updateCollectionField(collectionId, input.fieldId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.collectionFields(collectionId),
      });
    },
  });
}

export function useDeleteCollectionField(collectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: number) =>
      deleteCollectionField(collectionId, fieldId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.collectionFields(collectionId),
      });
    },
  });
}

export function useCreateCollectionItem(collectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      values: Record<string, unknown>;
      draft: boolean;
    }) => createCollectionItem(collectionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
      void queryClient.invalidateQueries({
        queryKey: ["cms", "collections", collectionId, "items"],
      });
    },
  });
}

export function useUpdateCollectionItem(
  collectionId: number,
  itemId: number,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      values: Record<string, unknown>;
      draft: boolean;
    }) => updateCollectionItem(collectionId, itemId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
      void queryClient.invalidateQueries({
        queryKey: ["cms", "collections", collectionId, "items"],
      });
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.collectionItem(collectionId, itemId),
      });
    },
  });
}

export function useDeleteCollectionItem(collectionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) =>
      deleteCollectionItem(collectionId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "collections"] });
      void queryClient.invalidateQueries({
        queryKey: ["cms", "collections", collectionId, "items"],
      });
    },
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: cmsQueryKeys.apiKeys,
    queryFn: fetchApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { label: string; scope: ApiKeyScope }) =>
      createApiKey(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.apiKeys });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.apiKeys });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: cmsQueryKeys.users,
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.users });
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.users });
    },
  });
}
