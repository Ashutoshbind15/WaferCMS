/**
 * Schemeful same-site check for cookie SameSite selection.
 * Same registrable domain (PSL eTLD+1) + scheme → Lax.
 * True cross-site origins need SameSite=None + Secure.
 */
import { getDomain } from "tldts";

export type CookieSameSite = "lax" | "none";

const tldtsOpts = {
  // Hostname already comes from WHATWG URL — don't re-parse.
  extractHostname: false,
  // Treat *.localhost as one site (local multi-host setups).
  validHosts: ["localhost"] as string[],
};

const registrableDomain = (hostname: string): string =>
  getDomain(hostname, tldtsOpts) ?? hostname.toLowerCase();

export const areSameSiteOrigins = (
  originA: string,
  originB: string,
): boolean => {
  let a: URL;
  let b: URL;
  try {
    a = new URL(originA);
    b = new URL(originB);
  } catch {
    return false;
  }

  if (a.protocol !== b.protocol) {
    return false;
  }

  return registrableDomain(a.hostname) === registrableDomain(b.hostname);
};

export const resolveCookieSameSite = (opts: {
  corsOrigin: string | undefined;
  publicBaseUrl: string | undefined;
  cookieSecure: boolean;
}): CookieSameSite => {
  const { corsOrigin, publicBaseUrl, cookieSecure } = opts;

  if (!corsOrigin || !publicBaseUrl) {
    return "lax";
  }

  if (areSameSiteOrigins(corsOrigin, publicBaseUrl)) {
    return "lax";
  }

  // Cross-site session cookies only work with Secure + SameSite=None.
  if (cookieSecure) {
    return "none";
  }

  return "lax";
};
