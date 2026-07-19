import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const fileMetadata = pgTable("file_metadata", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  /** Internal storage key (UUID-prefixed). Never exposed in API responses. */
  objectKey: text().notNull().unique(),
  originalFilename: text().notNull(),
  contentType: text(),
  byteLength: integer().notNull(),
  /** When true, asset bytes are reachable via GET /files/:id without auth. */
  isPublic: boolean().notNull().default(true),
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

export {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "./auth-schema.js";

export const collectionFieldTypeEnum = pgEnum("collection_field_type", [
  "text",
  "long-text",
  "richtext",
  "diagrams",
  "number",
  "date",
  "bool",
  "asset",
  "relation",
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
    /** When true, this field's value is used as the collection item display title. */
    isTitle: boolean().notNull().default(false),
    /** Target collection for `relation` fields; null for all other types. */
    relatedCollectionId: integer().references(() => collection.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.collectionId, table.key),
    uniqueIndex("collection_field_one_title_per_collection")
      .on(table.collectionId)
      .where(sql`${table.isTitle} = true`),
  ],
);

/** One row per entry in a collection. Field values live in collection_data_value. */
export const collectionData = pgTable("collection_data", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  collectionId: integer()
    .notNull()
    .references(() => collection.id, { onDelete: "cascade" }),
  /** When true, item is omitted from list/get unless includeDrafts is requested. */
  draft: boolean().notNull().default(false),
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
