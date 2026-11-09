/**
 * Cross-site URLs. The brand site and the coaching app are deployed separately,
 * so links between them must be absolute.
 *
 * NEXT_PUBLIC_* values are inlined at build time; set them per deployment.
 */
const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001");
export const APP_URL = trimSlash(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

/** Absolute URL on the brand / store site, e.g. siteUrl("/#movement-goods"). */
export function siteUrl(path: string = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute URL in the coaching app, e.g. appUrl("/quiz"). */
export function appUrl(path: string = "/"): string {
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
