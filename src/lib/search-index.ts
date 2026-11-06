import type { RegionId } from "./region";
import "server-only";
import type { SearchEntry } from "@/components/SearchBox";
import { categoryById } from "./categories";
import { activeCategories, getSummaries, categoryHref, getVsPairs } from "./catalog";
import { getGuides } from "./guides";

/**
 * Thumbnails only for the most popular products (owner, 2026-11-02: Vercel spend capped). The index is every product
 * in a region, about 24,000 in the UK, and the image URLs were a third of its bytes (8.4 MB, 1.5 MB gzipped, fetched
 * whole by each visitor who opens search). The long tail, mostly one-store listings, shows its name and price without
 * a picture, which every search UI already handles (`image` is optional).
 */
export const SEARCH_IMAGE_LIMIT = 2500;
const thumb = <T extends { image?: string }>(e: T, i: number): T => (i < SEARCH_IMAGE_LIMIT ? e : { ...e, image: undefined });

/** Everything the search box can find, phones in popularity order first. */
export function getSearchIndex(region: RegionId = "au"): SearchEntry[] {
  if (region !== "au")
    return [
      ...getSummaries(undefined, region)
        .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
        .map((p) => ({ kind: "phone" as const, href: p.href, name: p.name, codes: p.codes, image: p.image, price: p.bestPrice, stores: p.retailerCount, category: categoryById(p.category)?.name }))
        .map(thumb),
      ...activeCategories(region).map((c) => ({ kind: "category" as const, href: categoryHref(c.id, region), name: c.name })),
    ];
  return [
    ...getSummaries()
      .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
      .map((p) => ({ kind: "phone" as const, href: p.href, name: p.name, codes: p.codes, image: p.image, price: p.bestPrice, stores: p.retailerCount, category: categoryById(p.category)?.name }))
      .map(thumb),
    ...activeCategories().map((c) => ({ kind: "category" as const, href: c.href, name: c.name })),
    ...getVsPairs().map((v) => ({ kind: "vs" as const, href: `/compare/${v.slug}`, name: `${v.a.name} vs ${v.b.name}` })),
    ...getGuides().map((g) => ({ kind: "guide" as const, href: `/guides/${g.slug}`, name: g.title })),
  ];
}
