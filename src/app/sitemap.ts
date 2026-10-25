import type { MetadataRoute } from "next";
import { activeCategories, getBrands, getCatalog, getVsPairs, liveRegions } from "@/lib/catalog";
import { PREFIXED_REGIONS, withRegion } from "@/lib/region";
import { getGuides } from "@/lib/guides";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { phones, updatedAt } = getCatalog();
  const lastModified = new Date(updatedAt);
  return [
    ...["", ...activeCategories().map((c) => c.href), "/deals", "/brands", "/compare", "/guides", "/categories", "/about", "/contact", "/reviews", "/privacy", "/disclosure", "/affiliate-disclosure"].map((p) => ({ url: `${SITE}${p}`, lastModified, changeFrequency: "daily" as const, priority: p ? 0.8 : 1 })),
    ...getBrands().map((b) => ({ url: `${SITE}/brands/${b.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.7 })),
    ...activeCategories().map((c) => ({ url: `${SITE}/deals/${c.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.7 })),
    ...getGuides().map((g) => ({ url: `${SITE}/guides/${g.slug}`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getVsPairs().map((v) => ({ url: `${SITE}/compare/${v.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.6 })),
    ...phones.map((p) => ({ url: `${SITE}/${p.category}/${p.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.9 })),
    // The US and UK sites, once they have products.
    ...PREFIXED_REGIONS.filter((r) => liveRegions().includes(r)).flatMap((r) => {
      const { phones: products, updatedAt: u } = getCatalog(undefined, r);
      const lm = new Date(u);
      const to = (h: string) => `${SITE}${withRegion(h, r)}`;
      return [
        ...["/", "/deals", "/stores"].map((h) => ({ url: to(h), lastModified: lm, changeFrequency: "daily" as const, priority: h === "/" ? 1 : 0.8 })),
        ...activeCategories(r).flatMap((c) => [
          { url: to(`/${c.id}`), lastModified: lm, changeFrequency: "daily" as const, priority: 0.8 },
          { url: to(`/deals/${c.id}`), lastModified: lm, changeFrequency: "daily" as const, priority: 0.7 },
        ]),
        ...products.map((p) => ({ url: to(`/${p.category}/${p.slug}`), lastModified: lm, changeFrequency: "daily" as const, priority: 0.9 })),
      ];
    }),
  ];
}
