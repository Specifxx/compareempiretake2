import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** SEO-tool and bulk scrapers that send no visitors but cost bandwidth. Search engines stay allowed. */
const BLOCKED = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "Bytespider", "DataForSeoBot", "BLEXBot", "CCBot", "barkrowler", "SeekportBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/saved", "/admin", "/api/"] },
      { userAgent: BLOCKED, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
