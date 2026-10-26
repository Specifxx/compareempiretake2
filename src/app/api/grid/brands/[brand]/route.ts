import { packGrid, PAGE_SIZE, toGridItem } from "@/lib/browse";
import { getBrands, getSummaries } from "@/lib/catalog";

/**
 * A brand page's whole grid (a GridFile, lib/browse.ts): one static file per Australian brand with
 * more than a page of products, built with the deploy and served from the CDN, like the category
 * grids in ../../[region]/[category]. Never a function: unknown brands are a 404.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () => getBrands().filter((b) => b.count > PAGE_SIZE).map((b) => ({ brand: b.slug }));

export async function GET(_req: Request, { params }: { params: Promise<{ brand: string }> }) {
  const slug = (await params).brand;
  const brand = getBrands().find((b) => b.slug === slug);
  if (!brand) return new Response("Not found", { status: 404 });
  const items = getSummaries().filter((p) => p.brand === brand.brand).map((p) => toGridItem(p, "all"));
  return Response.json(packGrid(items), { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
