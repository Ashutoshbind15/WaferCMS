import { cmsPublicBaseUrl } from "./asset-url.js";

export { cmsPublicBaseUrl };

export const mcpResourceUrl = (): string => `${cmsPublicBaseUrl()}/mcp`;

export const adminUiOrigin = (): string => {
  const value = process.env.CORS_ORIGIN?.trim();
  if (!value) {
    throw new Error("CORS_ORIGIN is required for OAuth login/consent pages.");
  }
  return value.replace(/\/$/, "");
};

export const isMcpEnabled = (): boolean =>
  process.env.CMS_MCP_ENABLED === "true";
