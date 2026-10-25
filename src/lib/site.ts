/**
 * The one canonical host. compareempire.com redirects (308) to www, so every canonical, sitemap and
 * OG URL uses www: a bare-domain value of NEXT_PUBLIC_SITE_URL is upgraded rather than trusted.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.compareempire.com").replace(/\/$/, "").replace("://compareempire.com", "://www.compareempire.com");
export const SITE_NAME = "Compare Empire";
/** The business inbox: shown on the site, used as Reply-To, and the owner's alert address. */
export const CONTACT_EMAIL = "compareempire@outlook.com";
