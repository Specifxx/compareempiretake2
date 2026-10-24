import type { Metadata } from "next";
import { activeRetailers, getProducts } from "@/lib/catalog";
import { ogImage } from "@/lib/og";
import { REGION_IDS, REGIONS, withRegion, type RegionId } from "@/lib/region";

/** A region goes live once it has products; until then its pages 404. */
export const regionLive = (region: RegionId) => getProducts(undefined, region).length > 0;

const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK" };

/** hreflang alternates for the home page across live regions. */
export const homeLanguages = () => Object.fromEntries(REGION_IDS.filter(regionLive).map((r) => [REGIONS[r].hreflang, withRegion("/", r) || "/"]));

export function regionHomeMetadata(region: RegionId): Metadata {
  const R = REGIONS[region];
  const stores = activeRetailers(undefined, region).length;
  const title = `Compare Empire ${R.adjective} — compare tech prices across ${stores} ${R.adjective} stores`;
  const description = `Phones, laptops, TVs, headphones and more: every price at ${stores} ${R.adjective} stores, checked daily, with price history to spot fake sales in ${IN[region]}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: R.prefix, languages: homeLanguages() },
    openGraph: { title, description, images: [{ url: ogImage({ title: `Is that sale actually real? Compare ${R.adjective} prices`, stores, region }), width: 1200, height: 630 }] },
  };
}
