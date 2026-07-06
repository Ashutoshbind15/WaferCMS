import type { FileMetadataRow } from "@packages/cms-db/access";

export type FileResponse = {
  id: number;
  originalFilename: string;
  contentType: string | null;
  byteLength: number;
  isPublic: boolean;
  createdAt: Date;
  url?: string;
};

/**
 * Serialize a file_metadata row for API responses. `objectKey` is internal and
 * never exposed. `url` is included only for public files — private files omit
 * it so the bytes endpoint stays the only way to fetch them (with auth).
 */
export const toFileResponse = (
  row: FileMetadataRow,
  baseUrl: string,
): FileResponse => {
  const out: FileResponse = {
    id: row.id,
    originalFilename: row.originalFilename,
    contentType: row.contentType,
    byteLength: row.byteLength,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
  };
  if (row.isPublic) {
    out.url = `${baseUrl}/files/${row.id}`;
  }
  return out;
};
