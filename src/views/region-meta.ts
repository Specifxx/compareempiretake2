import type { Metadata } from "next";
import { activeRetailers, getProducts } from "@/lib/catalog";
import { ogImage } from "@/lib/og";
import { HOME_PATH, REGION_IDS, REGIONS, withRegion, withXDefault, type RegionId } from "@/lib/region";

/** A region goes live once it has products; until then its pages 404. */
export const regionLive = (region: RegionId) => getProducts(undefined, region).length > 0;

const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK" };

/** hreflang alternates for the home page across live regions; x-default is the root (the US home). */
export const homeLanguages = () => ({ ...Object.fromEntries(REGION_IDS.filter(regionLive).map((r) => [REGIONS[r].hreflang, HOME_PATH[r]])), "x-default": "/" });

export function regionHomeMetadata(region: RegionId): Metadata {
  const R = REGIONS[region];
  const stores = activeRetailers(undefined, region).length;
  // The root names no country (owner, 2026-11-01: "if anything, no region at all"); its stores are American.
  const title =
    region === "us"
      ? "Compare Empire — tech price comparison: phones, laptops, TVs & more"
      : `Compare Empire ${region === "au" ? "Australia" : R.adjective} — compare tech prices across ${stores} ${R.adjective} stores`;
  const description = `Phones, laptops, TVs, headphones and more: every price at ${stores} ${R.adjective} stores, checked daily, with price history to spot fake sales in ${IN[region]}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: HOME_PATH[region], languages: homeLanguages() },
    openGraph: { title, description, images: [{ url: ogImage({ title: `Is that sale actually real? Compare ${R.adjective} prices`, stores, region }), width: 1200, height: 630 }] },
  };
}

/**
 * hreflang alternates for a hub that exists in every live region at withRegion(path) (deals, browse), or only where
 * `has` says so (a category's deals or A–Z list). Lets the browser move a visitor to their own region's copy.
 */
export function hubLanguages(path: string, has: (r: RegionId) => boolean = () => true): Record<string, string> | undefined {
  const langs = withXDefault(Object.fromEntries(REGION_IDS.filter((r) => regionLive(r) && has(r)).map((r) => [REGIONS[r].hreflang, withRegion(path, r)])));
  return Object.keys(langs).length > 1 ? langs : undefined;
}
