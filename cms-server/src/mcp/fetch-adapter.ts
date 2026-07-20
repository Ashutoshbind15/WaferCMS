import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

/** Convert an Express request into a Fetch API Request (body already parsed). */
export const expressToFetchRequest = (req: ExpressRequest): Request => {
  const host = req.get("host") ?? "localhost";
  const proto = req.protocol || "http";
  const url = `${proto}://${host}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && method !== "DELETE";
  let body: string | undefined;
  if (hasBody) {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body !== undefined) {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  return new Request(url, {
    method,
    headers,
    body,
  });
};

/** Pipe a Fetch API Response into an Express response. */
export const sendFetchResponse = async (
  webRes: Response,
  res: ExpressResponse,
): Promise<void> => {
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    // Express manages transfer-encoding / content-length itself.
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const buffer = Buffer.from(await webRes.arrayBuffer());
  res.send(buffer);
};
