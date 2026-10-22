import "server-only";
import type { SearchEntry } from "@/components/SearchBox";
import { getSummaries, getVsPairs } from "./catalog";
import { getGuides } from "./guides";

/** Everything the search box can find, phones in popularity order first. */
export function getSearchIndex(): SearchEntry[] {
  return [
    ...getSummaries()
      .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
      .map((p) => ({ kind: "phone" as const, href: `/phones/${p.slug}`, name: p.name, image: p.image, price: p.bestPrice, stores: p.retailerCount })),
    ...getVsPairs().map((v) => ({ kind: "vs" as const, href: `/compare/${v.slug}`, name: `${v.a.name} vs ${v.b.name}` })),
    ...getGuides().map((g) => ({ kind: "guide" as const, href: `/guides/${g.slug}`, name: g.title })),
  ];
}
