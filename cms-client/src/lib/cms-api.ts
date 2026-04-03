const base =
  import.meta.env.VITE_CMS_API_BASE?.replace(/\/$/, "") ??
  "http://localhost:3001";

export type LibraryFileRecord = {
  id: number;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  createdAt: string;
};

export async function fetchLibraryFiles(): Promise<LibraryFileRecord[]> {
  const res = await fetch(`${base}/files`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export type UploadProgressCallback = (event: {
  loaded: number;
  total: number;
  /** 0-100 */
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
        reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}
