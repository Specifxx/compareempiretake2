import type { MetadataRoute } from "next";
import { getBrands, getCatalog } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { phones, updatedAt } = getCatalog();
  const lastModified = new Date(updatedAt);
  return [
    ...["", "/phones", "/deals", "/brands", "/compare", "/about"].map((p) => ({ url: `${SITE}${p}`, lastModified, changeFrequency: "daily" as const, priority: p ? 0.8 : 1 })),
    ...getBrands().map((b) => ({ url: `${SITE}/brands/${b.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.7 })),
    ...phones.map((p) => ({ url: `${SITE}/phones/${p.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.9 })),
  ];
}
