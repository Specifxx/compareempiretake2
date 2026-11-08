import "server-only";
import { activeCategories, getBrands, getCatalog, getProducts, getSeries, getVsPairs, liveRegions } from "./catalog";
import { getGuides } from "./guides";
import { brandIndexable, latest, productInSitemap, productLastmod } from "./indexing";
import { HOME_PATH, PREFIXED_REGIONS, withRegion, type RegionId } from "./region";
import { SITE } from "./site";
import type { CategoryId, Phone } from "./types";

/**
 * Which pages go in the sitemap. Every indexable page stays live and crawlable (the /browse pages link to all
 * of them); the sitemap only tells search engines where to start. A new site with ~28K programmatic product pages
 * per region, most sold by one store, looks thin (Search Console, 2026-10-29: impressions peaked and faded within
 * days of the first crawl), so the sitemap lists only products a buyer can compare: two or more stores in stock in
 * the US and UK, three or more in Australia, Canada and Singapore (lib/indexing.ts `productInSitemap`;
 * `SITEMAP_MIN_STORES` in Vercel widens Australia to 2),
 * brands with an indexable product, and the head-to-head pages. One-store and sold-out products are noindex.
 *
 * lastmod is each page's real last change (lib/indexing.ts `productLastmod`: the last day a price moved), never
 * the build time, and is left out where nothing records one.
 */
export { productInSitemap } from "./indexing";

export interface SitemapEntry { loc: string; lastmod?: string; priority?: number }
const abs = (path: string) => `${SITE}${path === "/" ? "" : path}` || SITE;

/** The sections of the sitemap index; each becomes /sitemaps/<id>.xml. */
export function sitemapSections(): { id: string; entries: () => SitemapEntry[] }[] {
  const au = getCatalog();
  // Pages built from today's prices change with every import; the rest carry no lastmod.
  const lastmod = new Date(au.updatedAt).toISOString();
  const priced = new Set([HOME_PATH.au, "/deals", "/launches", "/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/price-report"]);
  const sections: { id: string; entries: () => SitemapEntry[] }[] = [
    {
      id: "pages",
      entries: () =>
        [HOME_PATH.au, "/deals", "/launches", "/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/embed", "/price-report", "/is-this-a-good-price", "/categories", "/browse", "/guides", "/brands", "/compare", "/about", "/creators", "/network", "/contact", "/how-we-pick-stores", "/stores", "/list-your-store", "/reviews", "/disclosure", "/affiliate-disclosure", "/privacy"].map((p) => ({ loc: abs(p), ...(priced.has(p) ? { lastmod } : {}), priority: p === HOME_PATH.au ? 1 : 0.6 })),
    },
    {
      id: "categories",
      entries: () => [
        ...activeCategories().flatMap((c) => {
          const lm = categoryLastmod(c.id as CategoryId, "au");
          return [
            { loc: abs(c.href), lastmod: lm, priority: 0.9 },
            { loc: abs(`/browse/${c.id}`), lastmod: lm, priority: 0.5 },
            { loc: abs(`/deals/${c.id}`), lastmod: lm, priority: 0.6 },
          ];
        }),
      ],
    },
    { id: "guides", entries: () => getGuides().map((g) => ({ loc: abs(`/guides/${g.slug}`), lastmod: new Date(g.date).toISOString(), priority: 0.8 })) },
    { id: "products-au", entries: () => products("au") },
  ];
  sections.push(
    {
      id: "brands",
      entries: () =>
        getBrands()
          .map((b) => ({ b, ps: getProducts().filter((p) => p.brand === b.brand) }))
          .filter(({ ps }) => brandIndexable(ps))
          .map(({ b, ps }) => ({ loc: abs(`/brands/${b.slug}`), lastmod: latest(ps.map(lastmodOf)), priority: 0.5 })),
    },
    { id: "compare", entries: () => getVsPairs().map((v) => ({ loc: abs(`/compare/${v.slug}`), lastmod: latest([lastmodOf(v.a), lastmodOf(v.b)]), priority: 0.5 })) },
  );
  for (const r of PREFIXED_REGIONS.filter((x) => liveRegions().includes(x))) {
    const { updatedAt } = getCatalog(undefined, r);
    const lm = new Date(updatedAt).toISOString();
    sections.push(
      {
        id: `${r}-pages`,
        entries: () => [
          ...["/", "/deals", "/launches", "/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year"].map((p) => ({ loc: abs(withRegion(p, r)), lastmod: lm, priority: p === "/" ? 1 : 0.6 })),
          ...["/stores", "/browse"].map((p) => ({ loc: abs(withRegion(p, r)), priority: 0.6 })),
          // Only categories with at least one strong product (2026-11-06: Canada and Singapore start with a few stores,
          // and a category page listing only one-store products is as thin as those products' own pages).
          ...activeCategories(r).filter((c) => getProducts(c.id as CategoryId, r).some(productInSitemap)).flatMap((c) => {
            const clm = categoryLastmod(c.id as CategoryId, r);
            return [
              { loc: abs(withRegion(`/${c.id}`, r)), lastmod: clm, priority: 0.9 },
              { loc: abs(withRegion(`/browse/${c.id}`, r)), lastmod: clm, priority: 0.5 },
            ];
          }),
        ],
      },
      { id: `products-${r}`, entries: () => products(r) },
    );
  }
  return sections;
}

/** The day a product's page last changed (the last price move), as the sitemap's lastmod. */
const lastmodOf = (p: Phone) => productLastmod(p, getSeries(p));
/** A category page changes whenever one of its products does. */
const categoryLastmod = (category: CategoryId, region: RegionId) => latest(getProducts(category, region).map(lastmodOf));

function products(region: RegionId): SitemapEntry[] {
  return getProducts(undefined, region)
    .filter(productInSitemap)
    .map((p) => ({ loc: abs(withRegion(`/${p.category}/${p.slug}`, region)), lastmod: lastmodOf(p), priority: p.retailerCount >= 5 ? 0.8 : 0.7 }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export function urlsetXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
}
/** The index: each child sitemap dated by its newest entry. */
export function indexXml(sections: { id: string; lastmod?: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sections
    .map(({ id, lastmod }) => `<sitemap><loc>${SITE}/sitemaps/${id}.xml</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
}
export const XML_HEADERS = { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" };
