/** OAuth scopes granted to MCP agents (no users:* / api-keys:*). */
export const MCP_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "collections:read",
  "collections:write",
  "items:read",
  "items:write",
  "files:read",
  "files:write",
  "ai:draft",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const MCP_CONTENT_SCOPES = [
  "collections:read",
  "collections:write",
  "items:read",
  "items:write",
  "files:read",
  "files:write",
  "ai:draft",
] as const;

export const parseScopeClaim = (scope: unknown): Set<string> => {
  if (typeof scope !== "string" || !scope.trim()) {
    return new Set();
  }
  return new Set(scope.split(/\s+/).filter(Boolean));
};

export const hasScope = (granted: Set<string>, required: string): boolean =>
  granted.has(required);
