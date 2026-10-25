import { getCatalog } from "@/lib/catalog";
import { indexXml, sitemapSections, XML_HEADERS } from "@/lib/seo";

// The sitemap index: one child sitemap per section (src/lib/seo.ts decides what's in each tier).
export const dynamic = "force-static";

export function GET() {
  const ids = sitemapSections().filter((s) => s.entries().length > 0).map((s) => s.id);
  return new Response(indexXml(ids, new Date(getCatalog().updatedAt).toISOString()), { headers: XML_HEADERS });
}
