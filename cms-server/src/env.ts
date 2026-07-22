import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

const envShape = {
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  CMS_STRICT_CONFIG: z.enum(["true", "false"]).optional(),
  CMS_TRUST_PROXY: z.enum(["true", "false"]).optional(),

  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.url().optional(),
  CMS_PUBLIC_BASE_URL: z.url().optional(),
  CORS_ORIGIN: z.url().optional(),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),

  CMS_REQUIRE_API_KEY: z.enum(["true", "false"]).optional(),
  CMS_API_KEY_PEPPER: z.string().min(1).optional(),

  CMS_IMAGE_MAX_BYTES: positiveInt.default(20 * 1024 * 1024),
  CMS_IMAGE_MAX_DIMENSION: positiveInt.default(4096),
  CMS_UPLOAD_MAX_BYTES: positiveInt.optional(),

  CMS_RATE_LIMIT_LOGIN_WINDOW_MS: positiveInt.default(15 * 60 * 1000),
  CMS_RATE_LIMIT_LOGIN_MAX: positiveInt.default(20),
  CMS_RATE_LIMIT_AI_WINDOW_MS: positiveInt.default(15 * 60 * 1000),
  CMS_RATE_LIMIT_AI_MAX: positiveInt.default(60),
  CMS_RATE_LIMIT_GLOBAL_WINDOW_MS: positiveInt.default(60 * 1000),
  CMS_RATE_LIMIT_GLOBAL_MAX: positiveInt.default(300),
};

export const env = createEnv({
  server: envShape,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  createFinalSchema: (shape) =>
    z.object(shape).superRefine((data, ctx) => {
      const strict =
        data.NODE_ENV === "production" || data.CMS_STRICT_CONFIG === "true";
      if (!strict) {
        return;
      }

      if (!data.BETTER_AUTH_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["BETTER_AUTH_SECRET"],
          message:
            "required in production/strict mode (generate with: openssl rand -base64 32)",
        });
      }

      const requireApiKey = data.CMS_REQUIRE_API_KEY !== "false";
      if (requireApiKey && !data.CMS_API_KEY_PEPPER) {
        ctx.addIssue({
          code: "custom",
          path: ["CMS_API_KEY_PEPPER"],
          message:
            "required when CMS_REQUIRE_API_KEY is enabled (production/strict mode)",
        });
      }

      const publicBase = data.CMS_PUBLIC_BASE_URL ?? data.BETTER_AUTH_URL;
      if (!publicBase) {
        ctx.addIssue({
          code: "custom",
          path: ["CMS_PUBLIC_BASE_URL"],
          message: "https URL is required in production/strict mode",
        });
      } else if (!publicBase.startsWith("https:")) {
        ctx.addIssue({
          code: "custom",
          path: ["CMS_PUBLIC_BASE_URL"],
          message: `must be https in production/strict mode (got ${publicBase})`,
        });
      }

      if (!data.CORS_ORIGIN) {
        ctx.addIssue({
          code: "custom",
          path: ["CORS_ORIGIN"],
          message:
            "required in production/strict mode (admin UI origin, e.g. https://cms.example.com)",
        });
      }

      if (data.COOKIE_SECURE !== "true") {
        ctx.addIssue({
          code: "custom",
          path: ["COOKIE_SECURE"],
          message: "must be true in production/strict mode",
        });
      }
    }),
  onValidationError: (issues) => {
    console.error("WaferCMS refused to start: invalid environment configuration.");
    for (const issue of issues) {
      const path = issue.path?.join(".") ?? "";
      console.error(`  - ${path ? `${path}: ` : ""}${issue.message}`);
    }
    process.exit(1);
  },
});

export const isStrictConfig = (): boolean =>
  env.NODE_ENV === "production" || env.CMS_STRICT_CONFIG === "true";
