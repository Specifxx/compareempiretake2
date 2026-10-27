import { CATEGORIES } from "@/lib/categories";
import { getGuides } from "@/lib/guides";
import { RETAILERS } from "@/lib/retailers";
import { SITE, SITE_NAME } from "@/lib/site";

// /llms.txt (llmstxt.org): a plain map of the site for AI answer engines, as RiftCompare publishes,
// so "where do I compare phone prices in Australia" can be answered with a link here. Built once per deploy.
export const dynamic = "force-static";

export function GET() {
  const live = CATEGORIES.filter((c) => c.live);
  const md = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} compares Australian prices for phones, tablets, laptops, TVs, PC parts and other tech across ${Object.keys(RETAILERS).length} Australian retailers, with price history, and has US and UK editions. Free, no account needed.`,
    "",
    "## Categories (Australia)",
    ...live.map((c) => `- [${c.name}](${SITE}${c.href}): ${c.blurb}`),
    "",
    "## Other editions",
    `- [United States](${SITE}/us)`,
    `- [United Kingdom](${SITE}/uk)`,
    "",
    "## Pages",
    `- [Deals](${SITE}/deals)`,
    `- [Brands](${SITE}/brands)`,
    `- [About](${SITE}/about)`,
    "",
    "## Guides",
    ...getGuides().map((g) => `- [${g.title}](${SITE}/guides/${g.slug}): ${g.description}`),
    "",
  ].join("\n");
  return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
