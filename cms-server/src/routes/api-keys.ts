import { randomBytes } from "node:crypto";
import { Router } from "express";
import {
  createApiKey,
  isApiKeyScope,
  listApiKeys,
  revokeApiKey,
} from "@packages/cms-db/api-keys";
import { parseIdParam, sendRouteError } from "../lib/http";

const router: Router = Router();

const getPepper = (): string => {
  const pepper = process.env.CMS_API_KEY_PEPPER?.trim();
  if (!pepper) {
    throw new Error("CMS API key auth is not configured.");
  }
  return pepper;
};

const generateRawApiKey = (): string =>
  `cms_${randomBytes(32).toString("hex")}`;

router.get("/", async (_req, res) => {
  try {
    const keys = await listApiKeys();
    res.json({ data: keys });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { label, scope } = req.body as {
      label?: unknown;
      scope?: unknown;
    };

    if (typeof label !== "string" || !label.trim()) {
      res.status(400).json({ error: "Label is required." });
      return;
    }

    if (!isApiKeyScope(scope)) {
      res.status(400).json({ error: "Invalid scope." });
      return;
    }

    const rawKey = generateRawApiKey();
    const record = await createApiKey({
      label,
      scope,
      rawKey,
      pepper: getPepper(),
    });

    res.status(201).json({ ...record, rawKey });
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { enabled } = req.body as { enabled?: unknown };

    if (enabled !== false) {
      res.status(400).json({ error: "Only revocation is supported." });
      return;
    }

    const record = await revokeApiKey(parseIdParam(req.params.id));
    res.json(record);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
