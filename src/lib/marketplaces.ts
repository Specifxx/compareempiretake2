/**
 * Marketplaces we link to as a search rather than compare price by price:
 * their listings mix new, used and grey imports, so a single "price" would mislead.
 * Affiliate IDs are optional env vars — set them in Vercel once approved and
 * every link picks them up; nothing else changes.
 *   NEXT_PUBLIC_AMAZON_TAG       Amazon Associates AU tracking id (e.g. compareempire-22)
 *   NEXT_PUBLIC_EBAY_CAMPAIGN_ID eBay Partner Network campaign id
 */
export interface Marketplace {
  id: "ebay" | "amazon";
  name: string;
  url: (query: string) => string;
  note: string;
}

const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG;
const ebayCampaign = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID;

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
    url: (q) =>
      `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=9355&LH_ItemCondition=1000&LH_PrefLoc=1${
        ebayCampaign ? `&mkcid=1&mkrid=705-53470-19255-0&campid=${ebayCampaign}&toolid=10001&mkevt=1` : ""
      }`,
  },
];
