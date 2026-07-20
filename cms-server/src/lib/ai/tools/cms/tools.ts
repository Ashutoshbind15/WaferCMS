import { tool, type ToolSet } from "ai";
import { runCmsTool } from "./errors.js";
import * as ops from "./ops.js";
import {
  createItemInputSchema,
  deleteItemInputSchema,
  getCollectionInputSchema,
  getFieldInputSchema,
  getFileMetaInputSchema,
  getItemInputSchema,
  listCollectionsInputSchema,
  listFieldsInputSchema,
  listFilesInputSchema,
  listItemsInputSchema,
  updateItemInputSchema,
} from "./schemas.js";

export type CreateCmsToolsOptions = {
  /**
   * When false, only read tools are registered (collections/fields/items/files).
   * Defaults to true — item writes are included; prefer drafts via schema defaults.
   */
  allowWrites?: boolean;
};

/**
 * In-process CMS tools for the admin task agent.
 * Calls DB/storage directly — never HTTP-to-self or public MCP.
 * Every execute returns a client-safe CmsToolResult (shown in the run UI).
 */
export const createCmsTools = (
  options: CreateCmsToolsOptions = {},
): ToolSet => {
  const allowWrites = options.allowWrites !== false;

  const readTools = {
    list_collections: tool({
      description: "List CMS collections (paginated).",
      inputSchema: listCollectionsInputSchema,
      execute: async ({ page, limit }) =>
        runCmsTool(() => ops.listCollections(page, limit)),
    }),

    get_collection: tool({
      description: "Get a collection by id or slug.",
      inputSchema: getCollectionInputSchema,
      execute: async (input) => runCmsTool(() => ops.getCollection(input)),
    }),

    list_fields: tool({
      description: "List fields for a collection (schema / types).",
      inputSchema: listFieldsInputSchema,
      execute: async ({ collectionId }) =>
        runCmsTool(() => ops.listFields(collectionId)),
    }),

    get_field: tool({
      description: "Get a single collection field by id.",
      inputSchema: getFieldInputSchema,
      execute: async ({ collectionId, fieldId }) =>
        runCmsTool(() => ops.getField(collectionId, fieldId)),
    }),

    list_items: tool({
      description:
        "List items in a collection (paginated). Drafts are excluded unless includeDrafts is true.",
      inputSchema: listItemsInputSchema,
      execute: async (input) => runCmsTool(() => ops.listItems(input)),
    }),

    get_item: tool({
      description:
        "Get a collection item by id. Drafts need includeDrafts=true.",
      inputSchema: getItemInputSchema,
      execute: async (input) => runCmsTool(() => ops.getItem(input)),
    }),

    list_files: tool({
      description: "List media library files (metadata only).",
      inputSchema: listFilesInputSchema,
      execute: async ({ page, limit }) =>
        runCmsTool(() => ops.listFiles(page, limit)),
    }),

    get_file_meta: tool({
      description: "Get file metadata by id (no binary download).",
      inputSchema: getFileMetaInputSchema,
      execute: async ({ id }) => runCmsTool(() => ops.getFileMeta(id)),
    }),
  } satisfies ToolSet;

  if (!allowWrites) {
    return readTools;
  }

  return {
    ...readTools,
    create_item: tool({
      description:
        "Create a collection item. Defaults to draft=true; set draft=false only to publish.",
      inputSchema: createItemInputSchema,
      execute: async ({ collectionId, values, draft }) =>
        runCmsTool(() => ops.createItem(collectionId, { values, draft })),
    }),

    update_item: tool({
      description:
        "Update a collection item. Omit draft to keep the current draft/published status; set draft=false only to publish.",
      inputSchema: updateItemInputSchema,
      execute: async ({ collectionId, itemId, values, draft }) =>
        runCmsTool(() =>
          ops.updateItem(collectionId, itemId, { values, draft }),
        ),
    }),

    delete_item: tool({
      description: "Permanently delete a collection item.",
      inputSchema: deleteItemInputSchema,
      execute: async ({ collectionId, itemId }) =>
        runCmsTool(() => ops.deleteItem(collectionId, itemId)),
    }),
  } satisfies ToolSet;
};

export type CmsTools = ReturnType<typeof createCmsTools>;
