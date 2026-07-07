const base =
  import.meta.env.VITE_CMS_API_BASE?.replace(/\/$/, "") ??
  "http://localhost:3001";

export type PagePagination = {
  mode: "page";
  page: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
  total?: number;
  totalPages?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PagePagination;
};

export type ListQuery = {
  page?: number;
  limit?: number;
  count?: boolean;
};

export type SessionUser = {
  id: number;
  username: string;
};

export type UserRecord = {
  id: number;
  username: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

const buildListQuery = (query: ListQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query.count) {
    params.set("count", "true");
  }
  return params.toString();
};

export type CollectionRecord = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionFieldRecord = {
  id: number;
  collectionId: number;
  key: string;
  label: string;
  fieldType: CollectionFieldType;
  position: number;
  required: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CollectionFieldType =
  | "text"
  | "long-text"
  | "richtext"
  | "diagrams";

export type CollectionItemRecord = {
  id: number;
  collectionId: number;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ApiKeyScope = "read" | "write" | "read_write";

export type LibraryFileRecord = {
  id: number;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  isPublic: boolean;
  createdAt: string;
  /** Present only when isPublic is true. */
  url?: string;
};

/** Build the asset bytes URL for a file. */
export const fileAssetUrl = (id: number): string => `${base}/files/${id}`;

const getErrorMessage = async (res: Response) => {
  const raw = await res.text();

  try {
    const data = JSON.parse(raw) as { error?: string };
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return raw || `Request failed (${res.status})`;
  }
};

async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    credentials: "include",
    ...init,
    headers: init?.headers,
  });
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init);
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

async function mutateJson(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<void> {
  const res = await apiFetch(input, init);
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
}

async function requestCreatedId(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ id: number }> {
  const res = await apiFetch(input, init);
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
  return res.json() as Promise<{ id: number }>;
}

async function deleteJson(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<void> {
  return mutateJson(input, init);
}

export async function fetchSession(): Promise<SessionUser | null> {
  const res = await apiFetch(`${base}/auth/me`);
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
  const data = (await res.json()) as { user: SessionUser };
  return data.user;
}

export async function login(input: {
  username: string;
  password: string;
}): Promise<SessionUser> {
  const data = await requestJson<{ user: SessionUser }>(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await requestJson(`${base}/auth/logout`, { method: "POST" });
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const result = await requestJson<{ data: UserRecord[] }>(`${base}/users`);
  return result.data;
}

export async function createUser(input: {
  username: string;
  password: string;
}): Promise<void> {
  return mutateJson(`${base}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function disableUser(id: number): Promise<void> {
  return mutateJson(`${base}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false }),
  });
}

export async function fetchLibraryFiles(
  query: ListQuery = { count: true },
): Promise<PaginatedResult<LibraryFileRecord>> {
  const qs = buildListQuery(query);
  const url = qs ? `${base}/files?${qs}` : `${base}/files`;
  return requestJson<PaginatedResult<LibraryFileRecord>>(url);
}

export async function patchLibraryFile(
  id: number,
  input: { isPublic: boolean },
): Promise<void> {
  return mutateJson(`${base}/files/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export type UploadProgressCallback = (event: {
  loaded: number;
  total: number;
  percent: number;
}) => void;

export function uploadLibraryFile(
  file: File,
  onProgress?: UploadProgressCallback,
  options?: { isPublic?: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/files`);
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const parsed = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(parsed.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(
            new Error(xhr.responseText || `Upload failed (${xhr.status})`),
          );
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    const body = new FormData();
    body.append("file", file);
    if (options && typeof options.isPublic === "boolean") {
      body.append("isPublic", String(options.isPublic));
    }
    xhr.send(body);
  });
}

export type ApiKeyRecord = {
  id: number;
  label: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CreatedApiKeyRecord = ApiKeyRecord & {
  rawKey: string;
};

export async function fetchApiKeys(): Promise<ApiKeyRecord[]> {
  const result = await requestJson<{ data: ApiKeyRecord[] }>(`${base}/api-keys`);
  return result.data;
}

export async function createApiKey(input: {
  label: string;
  scope: ApiKeyScope;
}): Promise<CreatedApiKeyRecord> {
  return requestJson<CreatedApiKeyRecord>(`${base}/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function revokeApiKey(id: number): Promise<void> {
  return mutateJson(`${base}/api-keys/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false }),
  });
}

export async function fetchCollectionList(
  query: ListQuery = { count: true },
): Promise<PaginatedResult<CollectionRecord>> {
  const qs = buildListQuery(query);
  const url = qs ? `${base}/collections?${qs}` : `${base}/collections`;
  return requestJson<PaginatedResult<CollectionRecord>>(url);
}

export async function fetchCollectionBySlug(
  slug: string,
): Promise<CollectionRecord> {
  return requestJson<CollectionRecord>(
    `${base}/collections/by-slug/${encodeURIComponent(slug)}`,
  );
}

export async function fetchCollection(id: number): Promise<CollectionRecord> {
  return requestJson<CollectionRecord>(`${base}/collections/${id}`);
}

export async function createCollection(input: {
  slug: string;
  title: string;
  description?: string | null;
}): Promise<{ id: number }> {
  return requestCreatedId(`${base}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateCollection(
  id: number,
  input: { slug: string; title: string; description?: string | null },
): Promise<void> {
  return mutateJson(`${base}/collections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteCollection(id: number) {
  return deleteJson(`${base}/collections/${id}`, { method: "DELETE" });
}

export async function fetchCollectionFields(
  collectionId: number,
): Promise<CollectionFieldRecord[]> {
  const result = await requestJson<{ data: CollectionFieldRecord[] }>(
    `${base}/collections/${collectionId}/fields`,
  );
  return result.data;
}

export async function createCollectionField(
  collectionId: number,
  input: {
    key: string;
    label: string;
    fieldType: CollectionFieldType;
    required?: boolean;
  },
): Promise<void> {
  return mutateJson(`${base}/collections/${collectionId}/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateCollectionField(
  collectionId: number,
  fieldId: number,
  input: {
    key: string;
    label: string;
    fieldType: CollectionFieldType;
    required?: boolean;
  },
): Promise<void> {
  return mutateJson(
    `${base}/collections/${collectionId}/fields/${fieldId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCollectionField(
  collectionId: number,
  fieldId: number,
) {
  return deleteJson(
    `${base}/collections/${collectionId}/fields/${fieldId}`,
    { method: "DELETE" },
  );
}

export async function fetchCollectionItems(
  collectionId: number,
  query: ListQuery = { count: true },
): Promise<PaginatedResult<CollectionItemRecord>> {
  const qs = buildListQuery(query);
  const url = qs
    ? `${base}/collections/${collectionId}/items?${qs}`
    : `${base}/collections/${collectionId}/items`;
  return requestJson<PaginatedResult<CollectionItemRecord>>(url);
}

export async function fetchCollectionItem(
  collectionId: number,
  itemId: number,
): Promise<CollectionItemRecord> {
  return requestJson<CollectionItemRecord>(
    `${base}/collections/${collectionId}/items/${itemId}`,
  );
}

export async function createCollectionItem(
  collectionId: number,
  input: { values: Record<string, unknown> },
): Promise<{ id: number }> {
  return requestCreatedId(
    `${base}/collections/${collectionId}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function updateCollectionItem(
  collectionId: number,
  itemId: number,
  input: { values: Record<string, unknown> },
): Promise<void> {
  return mutateJson(
    `${base}/collections/${collectionId}/items/${itemId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCollectionItem(
  collectionId: number,
  itemId: number,
) {
  return deleteJson(`${base}/collections/${collectionId}/items/${itemId}`, {
    method: "DELETE",
  });
}
