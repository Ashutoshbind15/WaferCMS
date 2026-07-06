/**
 * Public base URL where cms-server is reachable by browsers/integrators, with
 * any trailing slash trimmed. Put a CDN/reverse proxy in front of this in
 * production and cache `GET /files/*` for public assets.
 *
 * Example: `http://localhost:3001` → file URL `http://localhost:3001/files/42`.
 */
export function cmsPublicBaseUrl(): string {
  const base = process.env.CMS_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("CMS_PUBLIC_BASE_URL is not set");
  }
  return base;
}
