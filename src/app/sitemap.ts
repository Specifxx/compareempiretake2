import type { MetadataRoute } from "next";
import { activeCategories, getBrands, getCatalog, getVsPairs } from "@/lib/catalog";
import { getGuides } from "@/lib/guides";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { phones, updatedAt } = getCatalog();
  const lastModified = new Date(updatedAt);
  return [
    ...["", ...activeCategories().map((c) => c.href), "/deals", "/brands", "/compare", "/guides", "/categories", "/about", "/contact", "/reviews", "/privacy"].map((p) => ({ url: `${SITE}${p}`, lastModified, changeFrequency: "daily" as const, priority: p ? 0.8 : 1 })),
    ...getBrands().map((b) => ({ url: `${SITE}/brands/${b.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.7 })),
    ...activeCategories().map((c) => ({ url: `${SITE}/deals/${c.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.7 })),
    ...getGuides().map((g) => ({ url: `${SITE}/guides/${g.slug}`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getVsPairs().map((v) => ({ url: `${SITE}/compare/${v.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.6 })),
    ...phones.map((p) => ({ url: `${SITE}/${p.category}/${p.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.9 })),
  ];
}
