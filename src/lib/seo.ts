import "server-only";
import { activeCategories, getBrands, getCatalog, getVsPairs, liveRegions } from "./catalog";
import { getGuides } from "./guides";
import { HOME_PATH, PREFIXED_REGIONS, withRegion, type RegionId } from "./region";
import { SITE } from "./site";
import type { Phone } from "./types";

/**
 * Which pages go in the sitemap. Every page stays live and crawlable (the /browse pages link to all
 * of them); the sitemap only tells search engines where to start. A new site with ~28K programmatic
 * product pages, most sold by one store, looks thin, so we submit in tiers and expand once Search
 * Console shows the earlier tier indexed:
 *
 *   1  hubs (home, categories, deals, stores, browse, guides) + products sold by 3+ stores
 *   2  + products at 2 stores, brand pages, category deals, head-to-head comparisons  (default since 2026-11-01)
 *   3  + every product
 *
 * Raise it with the SITEMAP_TIER env var in Vercel (it's read at build), or change the default here.
 */
export const SITEMAP_TIER = Math.min(3, Math.max(1, Number(process.env.SITEMAP_TIER || 2)));

/** Minimum stores a product needs to be in the sitemap at each tier. */
const MIN_STORES: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
export const productInSitemap = (p: Phone) => p.retailerCount >= MIN_STORES[SITEMAP_TIER];

export interface SitemapEntry { loc: string; lastmod?: string; priority?: number }
const abs = (path: string) => `${SITE}${path === "/" ? "" : path}` || SITE;

/** The sections of the sitemap index; each becomes /sitemaps/<id>.xml. */
export function sitemapSections(): { id: string; entries: () => SitemapEntry[] }[] {
  const au = getCatalog();
  const lastmod = new Date(au.updatedAt).toISOString();
  const sections: { id: string; entries: () => SitemapEntry[] }[] = [
    {
      id: "pages",
      entries: () =>
        [HOME_PATH.au, "/deals", "/black-friday", "/embed", "/categories", "/browse", "/guides", "/brands", "/compare", "/about", "/network", "/contact", "/reviews", "/disclosure", "/affiliate-disclosure", "/privacy"].map((p) => ({ loc: abs(p), lastmod, priority: p === HOME_PATH.au ? 1 : 0.6 })),
    },
    {
      id: "categories",
      entries: () => [
        ...activeCategories().flatMap((c) => [
          { loc: abs(c.href), lastmod, priority: 0.9 },
          { loc: abs(`/browse/${c.id}`), lastmod, priority: 0.5 },
          ...(SITEMAP_TIER >= 2 ? [{ loc: abs(`/deals/${c.id}`), lastmod, priority: 0.6 }] : []),
        ]),
      ],
    },
    { id: "guides", entries: () => getGuides().map((g) => ({ loc: abs(`/guides/${g.slug}`), lastmod: new Date(g.date).toISOString(), priority: 0.8 })) },
    { id: "products-au", entries: () => products("au") },
  ];
  if (SITEMAP_TIER >= 2) {
    sections.push(
      { id: "brands", entries: () => getBrands().map((b) => ({ loc: abs(`/brands/${b.slug}`), lastmod, priority: 0.5 })) },
      { id: "compare", entries: () => getVsPairs().map((v) => ({ loc: abs(`/compare/${v.slug}`), lastmod, priority: 0.5 })) },
    );
  }
  for (const r of PREFIXED_REGIONS.filter((x) => liveRegions().includes(x))) {
    const { updatedAt } = getCatalog(undefined, r);
    const lm = new Date(updatedAt).toISOString();
    sections.push(
      {
        id: `${r}-pages`,
        entries: () => [
          ...["/", "/deals", "/black-friday", "/stores", "/browse"].map((p) => ({ loc: abs(withRegion(p, r)), lastmod: lm, priority: p === "/" ? 1 : 0.6 })),
          ...activeCategories(r).flatMap((c) => [
            { loc: abs(withRegion(`/${c.id}`, r)), lastmod: lm, priority: 0.9 },
            { loc: abs(withRegion(`/browse/${c.id}`, r)), lastmod: lm, priority: 0.5 },
          ]),
        ],
      },
      { id: `products-${r}`, entries: () => products(r) },
    );
  }
  return sections;
}

function products(region: RegionId): SitemapEntry[] {
  const { phones, updatedAt } = getCatalog(undefined, region);
  const lastmod = new Date(updatedAt).toISOString();
  return phones.filter(productInSitemap).map((p) => ({ loc: abs(withRegion(`/${p.category}/${p.slug}`, region)), lastmod, priority: p.retailerCount >= 3 ? 0.8 : 0.6 }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export function urlsetXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
}
export function indexXml(ids: string[], lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ids
    .map((id) => `<sitemap><loc>${SITE}/sitemaps/${id}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
}
export const XML_HEADERS = { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" };
