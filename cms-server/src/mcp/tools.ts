import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hasScope } from "../lib/mcp-scopes.js";
import { isAiDraftsEnabled } from "../lib/ai/features.js";
import * as ops from "./cms-ops.js";
import { errorResult, textResult } from "./errors.js";

const requireScope = (granted: Set<string>, scope: string) => {
  if (!hasScope(granted, scope)) {
    throw new Error(`Missing required scope: ${scope}`);
  }
};

const wrap =
  <Args extends Record<string, unknown>>(
    scopes: Set<string>,
    required: string,
    fn: (args: Args) => Promise<unknown>,
  ) =>
  async (args: Args) => {
    try {
      requireScope(scopes, required);
      return textResult(await fn(args));
    } catch (error) {
      return errorResult(error);
    }
  };

export const createMcpServer = (scopes: Set<string>): McpServer => {
  const server = new McpServer({
    name: "wafercms",
    version: "0.1.0",
  });

  server.registerTool(
    "list_collections",
    {
      description: "List CMS collections (paginated).",
      inputSchema: {
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    wrap(scopes, "collections:read", async (args) =>
      ops.mcpListCollections(args.page, args.limit),
    ),
  );

  server.registerTool(
    "get_collection",
    {
      description: "Get a collection by id or slug.",
      inputSchema: {
        id: z.number().int().positive().optional(),
        slug: z.string().min(1).optional(),
      },
    },
    wrap(scopes, "collections:read", async (args) =>
      ops.mcpGetCollection(args),
    ),
  );

  server.registerTool(
    "create_collection",
    {
      description: "Create a collection.",
      inputSchema: {
        slug: z.string().min(1),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
      },
    },
    wrap(scopes, "collections:write", async (args) =>
      ops.mcpCreateCollection(args),
    ),
  );

  server.registerTool(
    "update_collection",
    {
      description: "Update a collection by id.",
      inputSchema: {
        id: z.number().int().positive(),
        slug: z.string().min(1),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
      },
    },
    wrap(scopes, "collections:write", async (args) => {
      const { id, ...body } = args;
      return ops.mcpUpdateCollection(id, body);
    }),
  );

  server.registerTool(
    "delete_collection",
    {
      description: "Delete a collection by id.",
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    wrap(scopes, "collections:write", async (args) =>
      ops.mcpDeleteCollection(args.id),
    ),
  );

  server.registerTool(
    "list_fields",
    {
      description: "List fields for a collection.",
      inputSchema: {
        collectionId: z.number().int().positive(),
      },
    },
    wrap(scopes, "collections:read", async (args) =>
      ops.mcpListFields(args.collectionId),
    ),
  );

  server.registerTool(
    "get_field",
    {
      description: "Get a single collection field.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        fieldId: z.number().int().positive(),
      },
    },
    wrap(scopes, "collections:read", async (args) =>
      ops.mcpGetField(args.collectionId, args.fieldId),
    ),
  );

  server.registerTool(
    "create_field",
    {
      description: "Create a field on a collection.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        key: z.string().min(1),
        label: z.string().min(1),
        fieldType: z.string().min(1),
        required: z.boolean().optional(),
        isTitle: z.boolean().optional(),
        relatedCollectionId: z.number().int().positive().nullable().optional(),
      },
    },
    wrap(scopes, "collections:write", async (args) => {
      const { collectionId, ...body } = args;
      return ops.mcpCreateField(collectionId, body);
    }),
  );

  server.registerTool(
    "update_field",
    {
      description: "Update a collection field.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        fieldId: z.number().int().positive(),
        key: z.string().min(1),
        label: z.string().min(1),
        fieldType: z.string().min(1),
        required: z.boolean().optional(),
        isTitle: z.boolean().optional(),
        relatedCollectionId: z.number().int().positive().nullable().optional(),
      },
    },
    wrap(scopes, "collections:write", async (args) => {
      const { collectionId, fieldId, ...body } = args;
      return ops.mcpUpdateField(collectionId, fieldId, body);
    }),
  );

  server.registerTool(
    "delete_field",
    {
      description: "Delete a collection field.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        fieldId: z.number().int().positive(),
      },
    },
    wrap(scopes, "collections:write", async (args) =>
      ops.mcpDeleteField(args.collectionId, args.fieldId),
    ),
  );

  server.registerTool(
    "list_items",
    {
      description: "List items in a collection (paginated).",
      inputSchema: {
        collectionId: z.number().int().positive(),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
        includeDrafts: z.boolean().optional(),
      },
    },
    wrap(scopes, "items:read", async (args) => ops.mcpListItems(args)),
  );

  server.registerTool(
    "get_item",
    {
      description: "Get a collection item by id.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        includeDrafts: z.boolean().optional(),
      },
    },
    wrap(scopes, "items:read", async (args) => ops.mcpGetItem(args)),
  );

  server.registerTool(
    "create_item",
    {
      description: "Create a collection item (draft or published).",
      inputSchema: {
        collectionId: z.number().int().positive(),
        values: z.record(z.string(), z.unknown()),
        draft: z.boolean().optional(),
      },
    },
    wrap(scopes, "items:write", async (args) => {
      const { collectionId, ...body } = args;
      return ops.mcpCreateItem(collectionId, {
        values: body.values,
        draft: body.draft ?? false,
      });
    }),
  );

  server.registerTool(
    "update_item",
    {
      description: "Update a collection item.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        values: z.record(z.string(), z.unknown()),
        draft: z.boolean().optional(),
      },
    },
    wrap(scopes, "items:write", async (args) => {
      const { collectionId, itemId, ...body } = args;
      return ops.mcpUpdateItem(collectionId, itemId, {
        values: body.values,
        draft: body.draft ?? false,
      });
    }),
  );

  server.registerTool(
    "delete_item",
    {
      description: "Delete a collection item.",
      inputSchema: {
        collectionId: z.number().int().positive(),
        itemId: z.number().int().positive(),
      },
    },
    wrap(scopes, "items:write", async (args) =>
      ops.mcpDeleteItem(args.collectionId, args.itemId),
    ),
  );

  server.registerTool(
    "list_files",
    {
      description: "List media library files (metadata only).",
      inputSchema: {
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    wrap(scopes, "files:read", async (args) =>
      ops.mcpListFiles(args.page, args.limit),
    ),
  );

  server.registerTool(
    "get_file_meta",
    {
      description: "Get file metadata by id.",
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    wrap(scopes, "files:read", async (args) => ops.mcpGetFileMeta(args.id)),
  );

  server.registerTool(
    "upload_file",
    {
      description:
        "Upload a file from base64 content. Returns metadata (and public URL when applicable).",
      inputSchema: {
        filename: z.string().min(1),
        contentBase64: z.string().min(1),
        contentType: z.string().optional(),
        isPublic: z.boolean().optional(),
      },
    },
    wrap(scopes, "files:write", async (args) => ops.mcpUploadFile(args)),
  );

  server.registerTool(
    "patch_file",
    {
      description: "Update file visibility (isPublic).",
      inputSchema: {
        id: z.number().int().positive(),
        isPublic: z.boolean(),
      },
    },
    wrap(scopes, "files:write", async (args) =>
      ops.mcpPatchFile(args.id, args.isPublic),
    ),
  );

  if (isAiDraftsEnabled()) {
    server.registerTool(
      "ai_draft_item",
      {
        description:
          "Generate draft field values for a collection item using AI.",
        inputSchema: {
          collectionId: z.number().int().positive(),
          prompt: z.string().min(1),
          model: z.string().optional(),
        },
      },
      wrap(scopes, "ai:draft", async (args) => ops.mcpAiDraft(args)),
    );
  }

  return server;
};
