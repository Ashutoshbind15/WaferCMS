import type { CollectionFieldRow } from "@packages/cms-db/collections";
import type { PagePagination } from "@packages/cms-db/pagination";
import type { FileResponse } from "../../../files.js";

/** ISO timestamps so tool outputs are JSON-safe for the admin client. */
const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : String(value);

export type ClientCollection = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientField = {
  id: number;
  collectionId: number;
  key: string;
  label: string;
  fieldType: CollectionFieldRow["fieldType"];
  position: number;
  required: boolean;
  isTitle: boolean;
  relatedCollectionId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientItem = {
  id: number;
  collectionId: number;
  draft: boolean;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ClientPagination = {
  page: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
  total?: number;
  totalPages?: number;
};

export type ClientFile = Omit<FileResponse, "createdAt"> & {
  createdAt: string;
};

export const presentCollection = (row: {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ClientCollection => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
});

export const presentField = (row: CollectionFieldRow): ClientField => ({
  id: row.id,
  collectionId: row.collectionId,
  key: row.key,
  label: row.label,
  fieldType: row.fieldType,
  position: row.position,
  required: row.required,
  isTitle: row.isTitle,
  relatedCollectionId: row.relatedCollectionId,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
});

export const presentItem = (row: {
  id: number;
  collectionId: number;
  draft: boolean;
  values: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}): ClientItem => ({
  id: row.id,
  collectionId: row.collectionId,
  draft: row.draft,
  values: row.values,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
});

export const presentPagination = (
  pagination: PagePagination,
): ClientPagination => ({
  page: pagination.page,
  limit: pagination.limit,
  hasPrev: pagination.hasPrev,
  hasNext: pagination.hasNext,
  ...(pagination.total != null ? { total: pagination.total } : {}),
  ...(pagination.totalPages != null
    ? { totalPages: pagination.totalPages }
    : {}),
});

export const presentFile = (row: FileResponse): ClientFile => ({
  id: row.id,
  originalFilename: row.originalFilename,
  contentType: row.contentType,
  byteLength: row.byteLength,
  isPublic: row.isPublic,
  createdAt: iso(row.createdAt),
  ...(row.url != null ? { url: row.url } : {}),
});
