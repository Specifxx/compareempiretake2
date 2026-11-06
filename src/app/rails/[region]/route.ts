// The side rails' tiles for one region (lib/side-rails.ts): one static JSON per region and release (force-static, every live
// region prerendered), fetched by components/SideRails.tsx only on a screen wide enough for the rails or once the dock may show.
import { liveRegions } from "@/lib/catalog";
import { railsFor } from "@/lib/side-rails";
import { REGION_IDS, type RegionId } from "@/lib/region";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return liveRegions().map((region) => ({ region }));
}

export function GET(_req: Request, { params }: { params: { region: string } }) {
  if (!(REGION_IDS as string[]).includes(params.region)) return new Response("Not found", { status: 404 });
  return Response.json(railsFor(params.region as RegionId), { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
