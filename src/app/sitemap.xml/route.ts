import { latest } from "@/lib/indexing";
import { indexXml, sitemapSections, XML_HEADERS } from "@/lib/seo";

// The sitemap index: one child sitemap per section (src/lib/seo.ts decides what's in each tier).
export const dynamic = "force-static";

export function GET() {
  const sections = sitemapSections()
    .map((s) => ({ id: s.id, entries: s.entries() }))
    .filter((s) => s.entries.length > 0)
    .map((s) => ({ id: s.id, lastmod: latest(s.entries.map((e) => e.lastmod)) }));
  return new Response(indexXml(sections), { headers: XML_HEADERS });
}
