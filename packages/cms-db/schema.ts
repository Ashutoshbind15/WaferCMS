import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
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

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  lastLoginAt: timestamp(),
});

export const collectionFieldTypeEnum = pgEnum("collection_field_type", [
  "text",
  "long-text",
  "richtext",
  "diagrams",
]);

export const collectionFieldTypeValues = collectionFieldTypeEnum.enumValues;
export type CollectionFieldType = (typeof collectionFieldTypeValues)[number];

export const collection = pgTable("collection", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const collectionField = pgTable(
  "collection_field",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    collectionId: integer()
      .notNull()
      .references(() => collection.id, { onDelete: "cascade" }),
    key: text().notNull(),
    label: text().notNull(),
    fieldType: collectionFieldTypeEnum().notNull(),
    position: integer().notNull(),
    required: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [unique().on(table.collectionId, table.key)],
);

/** One row per entry in a collection. Field values live in collection_data_value. */
export const collectionData = pgTable("collection_data", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  collectionId: integer()
    .notNull()
    .references(() => collection.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/** JSON value for a single field on a collection entry. */
export const collectionDataValue = pgTable(
  "collection_data_value",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    dataId: integer()
      .notNull()
      .references(() => collectionData.id, { onDelete: "cascade" }),
    fieldId: integer()
      .notNull()
      .references(() => collectionField.id, { onDelete: "cascade" }),
    value: json(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [unique().on(table.dataId, table.fieldId)],
);
