CREATE TYPE "public"."collection_field_type" AS ENUM('text', 'long-text', 'richtext', 'diagrams');--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_key_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"keyPrefix" text NOT NULL,
	"keyHash" text NOT NULL,
	"scope" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp,
	CONSTRAINT "api_key_keyHash_unique" UNIQUE("keyHash")
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collection_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collection_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"collectionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_data_value" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collection_data_value_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dataId" integer NOT NULL,
	"fieldId" integer NOT NULL,
	"value" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_data_value_dataId_fieldId_unique" UNIQUE("dataId","fieldId")
);
--> statement-breakpoint
CREATE TABLE "collection_field" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collection_field_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"collectionId" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"fieldType" "collection_field_type" NOT NULL,
	"position" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_field_collectionId_key_unique" UNIQUE("collectionId","key")
);
--> statement-breakpoint
CREATE TABLE "file_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "file_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"objectKey" text NOT NULL,
	"originalFilename" text NOT NULL,
	"contentType" text,
	"byteLength" integer NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_metadata_objectKey_unique" UNIQUE("objectKey")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"passwordHash" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastLoginAt" timestamp,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "collection_data" ADD CONSTRAINT "collection_data_collectionId_collection_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_data_value" ADD CONSTRAINT "collection_data_value_dataId_collection_data_id_fk" FOREIGN KEY ("dataId") REFERENCES "public"."collection_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_data_value" ADD CONSTRAINT "collection_data_value_fieldId_collection_field_id_fk" FOREIGN KEY ("fieldId") REFERENCES "public"."collection_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_field" ADD CONSTRAINT "collection_field_collectionId_collection_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;