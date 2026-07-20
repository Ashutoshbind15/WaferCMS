import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { jwt, username } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { findUserById } from "@packages/cms-db/users";
import db from "@packages/cms-db/db";
import * as schema from "@packages/cms-db/schema";
import { MCP_SCOPES } from "./mcp-scopes.js";
import {
  adminUiOrigin,
  cmsPublicBaseUrl,
  mcpResourceUrl,
} from "./public-url.js";

const secret = process.env.BETTER_AUTH_SECRET?.trim() || "";
if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Generate one (e.g. openssl rand -base64 32).",
  );
}

const baseURL =
  process.env.BETTER_AUTH_URL?.trim() ||
  process.env.CMS_PUBLIC_BASE_URL?.trim() ||
  "";
if (!baseURL) {
  throw new Error(
    "BETTER_AUTH_URL or CMS_PUBLIC_BASE_URL is required for Better Auth.",
  );
}

const corsOrigin = process.env.CORS_ORIGIN?.trim();
const cookieSecure = process.env.COOKIE_SECURE === "true";

export const auth = betterAuth({
  baseURL,
  basePath: "/auth",
  secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Public sign-up stays closed; admins are created via server-side helpers.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      enabled: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const record = await findUserById(session.userId);
          if (!record || !record.enabled) {
            throw new APIError("FORBIDDEN", {
              message: "User is disabled.",
            });
          }
          return { data: session };
        },
      },
    },
  },
  trustedOrigins: corsOrigin ? [corsOrigin] : [],
  advanced: {
    defaultCookieAttributes: {
      sameSite: corsOrigin && cookieSecure ? "none" : "lax",
      secure: cookieSecure,
    },
  },
  // Avoid conflicting with OAuth /oauth2/token.
  disabledPaths: ["/token"],
  plugins: [
    username(),
    jwt(),
    oauthProvider({
      loginPage: `${adminUiOrigin()}/login`,
      consentPage: `${adminUiOrigin()}/consent`,
      allowDynamicClientRegistration: true,
      // MCP clients (Cursor/Claude) register public clients without a prior session.
      allowUnauthenticatedClientRegistration: true,
      validAudiences: [mcpResourceUrl()],
      scopes: [...MCP_SCOPES],
      // Default DCR clients get read scopes; write/AI must be requested explicitly.
      clientRegistrationDefaultScopes: [
        "openid",
        "profile",
        "offline_access",
        "collections:read",
        "items:read",
        "files:read",
      ],
      clientRegistrationAllowedScopes: [...MCP_SCOPES],
      silenceWarnings: {
        oauthAuthServerConfig: true,
        openidConfig: true,
      },
    }),
  ],
});

export type Auth = typeof auth;

/** Issuer URL for access-token verification (baseURL + basePath). */
export const authIssuer = (): string =>
  `${cmsPublicBaseUrl().replace(/\/$/, "")}/auth`;
