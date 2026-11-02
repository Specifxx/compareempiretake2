/**
 * The one canonical host: the apex, compareempire.com, the host that serves the pages. www was canonical until
 * it lost its DNS record in the 2026-10-26 outage, after which every canonical, sitemap and OG URL pointed at a
 * host that did not resolve (DECISIONS.md, 2026-10-27). A www value of NEXT_PUBLIC_SITE_URL is moved to the apex.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://compareempire.com").replace(/\/$/, "").replace("://www.compareempire.com", "://compareempire.com");
export const SITE_NAME = "Compare Empire";
/** The business inbox: shown on the site, used as Reply-To, and the owner's alert address. */
export const CONTACT_EMAIL = "compareempire@outlook.com";

// The family list lives in lib/family-network.ts (FAMILY_SITES), the same file in every Compare Empire repo.
