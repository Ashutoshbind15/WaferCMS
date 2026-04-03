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

export async function uploadLibraryFile(
  file: File,
): Promise<LibraryFileRecord> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${base}/files`, { method: "POST", body });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
