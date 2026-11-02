/**
 * Marketplaces we link to as a search rather than compare price by price:
 * their listings mix new, used and grey imports, so a single "price" would mislead.
 * Affiliate IDs are optional env vars — set them in Vercel once approved and
 * every link picks them up; nothing else changes.
 * Amazon links carry the region's Associates tag (lib/amazon.ts); a region without one has no Amazon.
 * eBay links carry our EPN campaign id (see lib/ebay.ts).
 */
import { ebaySearch } from "./ebay";
import { amazonLink, amazonStore } from "./amazon";
import type { RegionId } from "./region";

export interface Marketplace {
  id: "ebay" | "amazon";
  name: string;
  url: (query: string, customid?: string, phones?: boolean) => string;
  note: string;
}

const EBAY_NAME = { au: "eBay AU", us: "eBay US", uk: "eBay UK" } as const;

/** Amazon and eBay searches for a region. Amazon only where that region's Amazon has our tag. */
export function marketplacesFor(region: RegionId = "au"): Marketplace[] {
  const a = amazonStore(region);
  return [
    ...(a
      ? [{ id: "amazon" as const, name: a.name, note: "New, sold by Amazon & marketplace sellers", url: (q: string) => amazonLink(region, q)! }]
      : []),
    { id: "ebay", name: EBAY_NAME[region], note: "New listings only — check the seller and warranty", url: (q, customid, phones) => ebaySearch(q, { condition: "new", customid, phones, region }) },
  ];
}

export const MARKETPLACES: Marketplace[] = marketplacesFor("au");
