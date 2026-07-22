import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { username } from "better-auth/plugins";
import { findUserById } from "@packages/cms-db/users";
import db from "@packages/cms-db/db";
import * as schema from "@packages/cms-db/schema";
import { env } from "../env.js";
import { resolveCookieSameSite } from "./same-site.js";

const secret = env.BETTER_AUTH_SECRET ?? "";
if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Generate one (e.g. openssl rand -base64 32).",
  );
}

const baseURL = env.BETTER_AUTH_URL ?? env.CMS_PUBLIC_BASE_URL ?? "";
if (!baseURL) {
  throw new Error(
    "BETTER_AUTH_URL or CMS_PUBLIC_BASE_URL is required for Better Auth.",
  );
}

const corsOrigin = env.CORS_ORIGIN;
const cookieSecure = env.COOKIE_SECURE === "true";
const sameSite = resolveCookieSameSite({
  corsOrigin,
  publicBaseUrl: baseURL,
  cookieSecure,
});

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
      sameSite,
      secure: cookieSecure,
    },
  },
  plugins: [username()],
});

export type Auth = typeof auth;
