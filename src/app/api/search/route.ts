import { hasCatalogue, isRegion, normaliseQuery, QUERY_MIN, searchEverything } from "@/lib/live-search";

/**
 * GET /api/search?q=<words>&r=<us|au|uk|ca|sg>: search everything (DECISIONS.md 2026-11-10). A function, cached by
 * Vercel's CDN per URL for six hours (owner rule: nothing under 21600), so one render answers every visitor who
 * searches the same words in that time. The /search page asks with the normalised query only, which keeps the keys
 * few. It reads the query string and nothing else of the request.
 */
export const dynamic = "force-dynamic";

const CACHED = {
  "cache-control": "public, max-age=600",
  "vercel-cdn-cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex",
};
const REFUSED = { "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" };

export function GET(req: Request) {
  const url = new URL(req.url);
  const q = normaliseQuery(url.searchParams.get("q"));
  const r = url.searchParams.get("r") ?? "us";
  if (q.length < QUERY_MIN) return Response.json({ error: "q must be at least 2 characters" }, { status: 400, headers: REFUSED });
  if (!isRegion(r)) return Response.json({ error: "r must be us, au, uk, ca or sg" }, { status: 400, headers: REFUSED });
  // Without its traced data every answer would be an empty list the CDN keeps for six hours: a 500 is never cached.
  if (!hasCatalogue(r)) throw new Error(`no catalogue for ${r}`);
  return Response.json(searchEverything(q, r), { headers: CACHED });
}
