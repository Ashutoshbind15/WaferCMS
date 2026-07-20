import { Router } from "express";
import { mcpHandler } from "@better-auth/oauth-provider";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { JWTPayload } from "jose";
import { authIssuer } from "../lib/auth.js";
import { parseScopeClaim } from "../lib/mcp-scopes.js";
import { mcpResourceUrl } from "../lib/public-url.js";
import { expressToFetchRequest, sendFetchResponse } from "./fetch-adapter.js";
import { createMcpServer } from "./tools.js";

const handleMcpRequest = mcpHandler(
  {
    verifyOptions: {
      issuer: authIssuer(),
      audience: mcpResourceUrl(),
    },
    jwksUrl: `${authIssuer()}/jwks`,
  },
  async (req: Request, jwt: JWTPayload) => {
    const scopes = parseScopeClaim(jwt.scope);
    const server = createMcpServer(scopes);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return transport.handleRequest(req);
  },
);

export const createMcpRouter = (): Router => {
  const router = Router();

  const run = async (
    req: Parameters<typeof expressToFetchRequest>[0],
    res: Parameters<typeof sendFetchResponse>[1],
  ) => {
    try {
      const response = await handleMcpRequest(expressToFetchRequest(req));
      await sendFetchResponse(response, res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "MCP request failed";
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      }
    }
  };

  router.post("/", (req, res) => {
    void run(req, res);
  });
  router.get("/", (req, res) => {
    void run(req, res);
  });
  router.delete("/", (req, res) => {
    void run(req, res);
  });

  return router;
};
