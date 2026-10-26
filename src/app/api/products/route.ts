import { getProduct, getProducts, summarise } from "@/lib/catalog";
import { parseProductQuery } from "@/lib/product-refs";

/**
 * GET /api/products?p=/phones/apple-iphone-17-pro,/phones/google-pixel-10[&view=summary]
 * The products the compare table (whole products) and the saved list (card summaries) show, so
 * those pages no longer carry the whole catalogue. A function like the product pages, and cached
 * the same way: Vercel's CDN keeps each answer (keyed by its query) for a day, every deploy starts
 * a fresh cache, and browsers keep it five minutes. Paths it doesn't know are left out.
 */
export const dynamic = "force-dynamic";

const CACHED = {
  "cache-control": "public, max-age=300",
  "vercel-cdn-cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
  "x-content-type-options": "nosniff",
};

export function GET(req: Request) {
  const url = new URL(req.url);
  const q = parseProductQuery(url.searchParams.get("p"), url.searchParams.get("view"));
  if (!q.ok) return Response.json({ error: q.error }, { status: 400, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  // Without its traced data every answer would be an empty list the CDN keeps for a day: fail with a 500 instead, which it never caches.
  for (const region of new Set(q.refs.map((r) => r.region))) if (!getProducts(undefined, region).length) throw new Error(`no catalogue for ${region}`);
  const found = q.refs.flatMap((r) => getProduct(r.category, r.slug, r.region) ?? []);
  return Response.json({ products: q.view === "summary" ? found.map(summarise) : found }, { headers: CACHED });
}
