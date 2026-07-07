import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createApiKey,
  createCollection,
  createCollectionField,
  createCollectionItem,
  createContent,
  createDiagram,
  createUser,
  deleteCollection,
  deleteCollectionField,
  deleteCollectionItem,
  deleteContent,
  deleteDiagram,
  disableUser,
  fetchApiKeys,
  fetchCollection,
  fetchCollectionFields,
  fetchCollectionItem,
  fetchCollectionItems,
  fetchCollectionList,
  fetchContent,
  fetchContentList,
  fetchDiagram,
  fetchDiagramList,
  fetchLibraryFiles,
  fetchUsers,
  patchLibraryFile,
  revokeApiKey,
  updateCollection,
  updateCollectionField,
  updateCollectionItem,
  updateContent,
  updateDiagram,
  type ApiKeyScope,
  type CollectionFieldType,
} from "@/lib/cms-api";

export const cmsQueryKeys = {
  content: (page: number) => ["cms", "content", { page }] as const,
  contentItem: (id: number) => ["cms", "content", id] as const,
  diagrams: (page: number) => ["cms", "diagrams", { page }] as const,
  diagram: (id: number) => ["cms", "diagrams", id] as const,
  files: (page: number) => ["cms", "files", { page }] as const,
  collections: (page: number) => ["cms", "collections", { page }] as const,
  collection: (id: number) => ["cms", "collections", id] as const,
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

export function useContentList(page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.content(page),
    queryFn: () => fetchContentList({ page, count: true }),
  });
}

export function useContent(id: number) {
  return useQuery({
    queryKey: cmsQueryKeys.contentItem(id),
    queryFn: () => fetchContent(id),
    enabled: validId(id),
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "content"] });
    },
  });
}

export function useUpdateContent(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { title: string; payload: unknown }) =>
      updateContent(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "content"] });
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.contentItem(id),
      });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "content"] });
    },
  });
}

export function useDiagramList(page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.diagrams(page),
    queryFn: () => fetchDiagramList({ page, count: true }),
  });
}

export function useDiagram(id: number) {
  return useQuery({
    queryKey: cmsQueryKeys.diagram(id),
    queryFn: () => fetchDiagram(id),
    enabled: validId(id),
  });
}

export function useCreateDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDiagram,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "diagrams"] });
    },
  });
}

export function useUpdateDiagram(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { title: string; payload: unknown }) =>
      updateDiagram(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "diagrams"] });
      void queryClient.invalidateQueries({
        queryKey: cmsQueryKeys.diagram(id),
      });
    },
  });
}

export function useDeleteDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDiagram,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms", "diagrams"] });
    },
  });
}

export function useLibraryFiles(page: number) {
  return useQuery({
    queryKey: cmsQueryKeys.files(page),
    queryFn: () => fetchLibraryFiles({ page, count: true }),
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
      fetchCollectionItems(collectionId, { page, count: true }),
    enabled: validId(collectionId),
  });
}

export function useCollectionItem(collectionId: number, itemId: number) {
  return useQuery({
    queryKey: cmsQueryKeys.collectionItem(collectionId, itemId),
    queryFn: () => fetchCollectionItem(collectionId, itemId),
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
    mutationFn: (input: { values: Record<string, unknown> }) =>
      createCollectionItem(collectionId, input),
    onSuccess: () => {
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
    mutationFn: (input: { values: Record<string, unknown> }) =>
      updateCollectionItem(collectionId, itemId, input),
    onSuccess: () => {
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
