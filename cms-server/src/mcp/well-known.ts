import { Router } from "express";
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { auth, authIssuer } from "../lib/auth.js";
import { MCP_CONTENT_SCOPES } from "../lib/mcp-scopes.js";
import { mcpResourceUrl } from "../lib/public-url.js";
import { mcpResourceClient } from "./resource-client.js";
import { expressToFetchRequest, sendFetchResponse } from "./fetch-adapter.js";

/**
 * Root-level OAuth discovery endpoints for MCP clients that look at
 * `/.well-known/...` instead of under `/auth`.
 */
export const createWellKnownRouter = (): Router => {
  const router = Router();
  const asMetadata = oauthProviderAuthServerMetadata(auth);
  const oidcMetadata = oauthProviderOpenIdConfigMetadata(auth);

  const handleAs = async (
    req: Parameters<typeof expressToFetchRequest>[0],
    res: Parameters<typeof sendFetchResponse>[1],
  ) => {
    const response = await asMetadata(expressToFetchRequest(req));
    await sendFetchResponse(response, res);
  };

  const handleOidc = async (
    req: Parameters<typeof expressToFetchRequest>[0],
    res: Parameters<typeof sendFetchResponse>[1],
  ) => {
    const response = await oidcMetadata(expressToFetchRequest(req));
    await sendFetchResponse(response, res);
  };

  router.get("/.well-known/oauth-authorization-server", (req, res) => {
    void handleAs(req, res);
  });
  // Path-inserted form for issuer `…/auth`
  router.get("/.well-known/oauth-authorization-server/auth", (req, res) => {
    void handleAs(req, res);
  });

  router.get("/.well-known/openid-configuration", (req, res) => {
    void handleOidc(req, res);
  });
  router.get("/.well-known/openid-configuration/auth", (req, res) => {
    void handleOidc(req, res);
  });

  const sendProtectedResource = async (
    req: Parameters<typeof expressToFetchRequest>[0],
    res: Parameters<typeof sendFetchResponse>[1],
  ) => {
    const metadata = await mcpResourceClient.getProtectedResourceMetadata({
      resource: mcpResourceUrl(),
      authorization_servers: [authIssuer()],
      scopes_supported: [...MCP_CONTENT_SCOPES],
    });
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Cache-Control",
      "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
    );
    res.status(200).json(metadata);
  };

  router.get("/.well-known/oauth-protected-resource", (req, res) => {
    void sendProtectedResource(req, res);
  });
  // Path-inserted form advertised in WWW-Authenticate for resource …/mcp
  router.get("/.well-known/oauth-protected-resource/mcp", (req, res) => {
    void sendProtectedResource(req, res);
  });

  return router;
};
