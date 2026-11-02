import { CATEGORIES } from "@/lib/categories";
import { getGuides } from "@/lib/guides";
import { RETAILERS } from "@/lib/retailers";
import { SITE, SITE_NAME } from "@/lib/site";

// /llms.txt (llmstxt.org): a plain map of the site for AI answer engines, as RiftCompare publishes,
// so "where do I compare phone prices" can be answered with a link here. Built once per deploy.
export const dynamic = "force-static";

export function GET() {
  const live = CATEGORIES.filter((c) => c.live);
  const md = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} compares prices for phones, tablets, laptops, TVs, appliances and other tech across stores in the United States, Australia and the United Kingdom (${Object.keys(RETAILERS).length} stores in all), each market in its own currency, with price history. Free, no account needed.`,
    "",
    "## Editions",
    `- [United States](${SITE}/)`,
    `- [Australia](${SITE}/au)`,
    `- [United Kingdom](${SITE}/uk)`,
    "",
    "## Categories (Australia)",
    ...live.map((c) => `- [${c.name}](${SITE}${c.href}): ${c.blurb}`),
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
