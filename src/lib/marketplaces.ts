/**
 * Marketplaces we link to as a search rather than compare price by price:
 * their listings mix new, used and grey imports, so a single "price" would mislead.
 * Affiliate IDs are optional env vars — set them in Vercel once approved and
 * every link picks them up; nothing else changes.
 *   NEXT_PUBLIC_AMAZON_TAG       Amazon Associates AU tracking id (e.g. compareempire-22)
 * eBay links carry our EPN campaign id (see lib/ebay.ts).
 */
import { ebaySearch } from "./ebay";

export interface Marketplace {
  id: "ebay" | "amazon";
  name: string;
  url: (query: string, customid?: string, phones?: boolean) => string;
  note: string;
}

const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG;

export const MARKETPLACES: Marketplace[] = [
  {
    id: "amazon",
    name: "Amazon AU",
    note: "New, sold by Amazon & marketplace sellers",
    url: (q) => `https://www.amazon.com.au/s?k=${encodeURIComponent(q)}&i=electronics${amazonTag ? `&tag=${amazonTag}` : ""}`,
  },
  {
    id: "ebay",
    name: "eBay AU",
    note: "New listings only — check the seller and warranty",
    url: (q, customid, phones) => ebaySearch(q, { condition: "new", customid, phones }),
  },
];
