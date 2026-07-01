const base =
  import.meta.env.VITE_CMS_API_BASE?.replace(/\/$/, "") ??
  "http://localhost:3001";

type EntityRecord = {
  id: number;
  title: string;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ContentRecord = EntityRecord;
export type DiagramRecord = EntityRecord;

export type LibraryFileRecord = {
  id: number;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  createdAt: string;
};

const getErrorMessage = async (res: Response) => {
  const raw = await res.text();

  try {
    const data = JSON.parse(raw) as { error?: string };
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return raw || `Request failed (${res.status})`;
  }
};

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

async function deleteJson(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ deleted: true }> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
  return res.json() as Promise<{ deleted: true }>;
}

export async function fetchContentList(): Promise<ContentRecord[]> {
  return requestJson<ContentRecord[]>(`${base}/content`);
}

export async function fetchContent(id: number): Promise<ContentRecord> {
  return requestJson<ContentRecord>(`${base}/content/${id}`);
}

export async function createContent(input: {
  title: string;
  payload: unknown;
}): Promise<ContentRecord> {
  return requestJson<ContentRecord>(`${base}/content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateContent(
  id: number,
  input: { title: string; payload: unknown },
): Promise<ContentRecord> {
  return requestJson<ContentRecord>(`${base}/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteContent(id: number) {
  return deleteJson(`${base}/content/${id}`, { method: "DELETE" });
}

export async function fetchDiagramList(): Promise<DiagramRecord[]> {
  return requestJson<DiagramRecord[]>(`${base}/diagrams`);
}

export async function fetchDiagram(id: number): Promise<DiagramRecord> {
  return requestJson<DiagramRecord>(`${base}/diagrams/${id}`);
}

export async function createDiagram(input: {
  title: string;
  payload: unknown;
}): Promise<DiagramRecord> {
  return requestJson<DiagramRecord>(`${base}/diagrams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateDiagram(
  id: number,
  input: { title: string; payload: unknown },
): Promise<DiagramRecord> {
  return requestJson<DiagramRecord>(`${base}/diagrams/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteDiagram(id: number) {
  return deleteJson(`${base}/diagrams/${id}`, { method: "DELETE" });
}

export async function fetchLibraryFiles(): Promise<LibraryFileRecord[]> {
  return requestJson<LibraryFileRecord[]>(`${base}/files`);
}

export type UploadProgressCallback = (event: {
  loaded: number;
  total: number;
  percent: number;
}) => void;

export function uploadLibraryFile(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<LibraryFileRecord> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/files`);

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
        try {
          resolve(JSON.parse(xhr.responseText) as LibraryFileRecord);
        } catch {
          reject(new Error("Invalid JSON response"));
        }
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
    xhr.send(body);
  });
}
