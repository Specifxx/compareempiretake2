import { packGrid, PAGE_SIZE, toGridItem } from "@/lib/browse";
import { activeCategories, getProducts, getSummaries, liveRegions } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";
import type { CategoryId } from "@/lib/types";

/**
 * A category's whole grid (a GridFile, lib/browse.ts), one static file per region and category
 * with more than a page of products, built with the deploy and served from the CDN. The category
 * page renders the first page itself; PhoneBrowser loads this when the page is idle, or at once
 * when someone filters, sorts or pages. Never a function: unknown pairs are a 404.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () =>
  liveRegions().flatMap((region) =>
    activeCategories(region)
      .filter((c) => getProducts(c.id as CategoryId, region).length > PAGE_SIZE)
      .map((c) => ({ region, category: c.id })),
  );

export async function GET(_req: Request, { params }: { params: Promise<{ region: string; category: string }> }) {
  const { region, category } = await params;
  const items = getSummaries(category as CategoryId, region as RegionId).map((p) => toGridItem(p, category));
  // The page asks for it with ?v=<format>.<import time>.<commit>, so a browser never keeps one past the data or code it belongs to.
  return Response.json(packGrid(items), { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
