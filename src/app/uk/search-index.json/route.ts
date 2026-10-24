import { getSearchIndex } from "@/lib/search-index";

// Built once per deploy and served from the CDN; the search box fetches it on first use.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getSearchIndex("uk"), { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
