import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const blogContent = pgTable("blog_content", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  payload: json().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const blogDiagram = pgTable("blog_diagram", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  payload: json().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const fileMetadata = pgTable("file_metadata", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  objectKey: text().notNull().unique(),
  /** Stable URL for the public portfolio app (CDN, reverse proxy, or direct RustFS). */
  publicUrl: text().notNull(),
  originalFilename: text().notNull(),
  contentType: text(),
  byteLength: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const apiKeyScopeValues = ["read", "write", "read_write"] as const;
export type ApiKeyScope = (typeof apiKeyScopeValues)[number];

export const apiKey = pgTable("api_key", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  label: text().notNull(),
  keyPrefix: text().notNull(),
  keyHash: text().notNull().unique(),
  scope: text().notNull().$type<ApiKeyScope>(),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  lastUsedAt: timestamp(),
});
