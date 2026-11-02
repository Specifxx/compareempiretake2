import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * SEO-tool and bulk scrapers that send no visitors but cost requests and origin transfer. Search engines and the AI
 * answer engines stay allowed. RiftCompare's list (owner, 2026-11-02: Vercel spend capped), plus the SEO tools this
 * site already blocked.
 */
const BLOCKED = [
  "AhrefsBot", "SemrushBot", "CCBot",
  "Bytespider", "meta-externalagent", "Meta-ExternalAgent",
  "MJ12bot", "DotBot", "PetalBot", "DataForSeoBot", "BLEXBot", "Barkrowler", "barkrowler", "serpstatbot", "SeekportBot", "ImagesiftBot", "Timpibot",
];

/**
 * QUERY-STRING URLS ARE NOT CRAWLED (2026-11-02). No sitemap URL carries a query and every page canonicalises to its
 * clean URL, but each ?v= / ?sort= / ?utm_ variant of a product page is its own CDN entry and so its own server render.
 * The Allows keep what a crawler needs that does carry a query: Next's assets, the share images (/og?t=…) and icons.
 * The longest matching rule wins, so each Allow beats "/*?".
 */
const QUERY_ALLOWS = ["/_next/", "/og", "/icon", "/apple-icon", "/*utm_source=share"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", ...QUERY_ALLOWS], disallow: ["/saved", "/admin", "/api/", "/embed/price", "/*?"] },
      { userAgent: BLOCKED, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
