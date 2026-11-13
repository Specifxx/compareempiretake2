// The ad tiles for one region (lib/side-rails.ts): one static JSON per region and release (force-static, every live
// region prerendered), fetched by components/useAdFeed.ts, for the in-page ad block and the phone dock.
import { liveRegions } from "@/lib/catalog";
import { railsFor } from "@/lib/side-rails";
import { REGION_IDS, type RegionId } from "@/lib/region";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return liveRegions().map((region) => ({ region }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  if (!(REGION_IDS as string[]).includes(region)) return new Response("Not found", { status: 404 });
  return Response.json(railsFor(region as RegionId), { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
