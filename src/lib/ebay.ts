/**
 * eBay Partner Network (EPN) links. Every eBay link on the site goes through
 * here so it carries our campaign id. eBay pays a share of the sale when a
 * visitor buys within 24 hours of clicking (and for new eBay sign-ups).
 * customid tells us in EPN reports which page sent the click.
 */
export const EBAY_CAMPAIGN_ID = "5339155912";
/** EPN rotation id for ebay.com.au. */
const EBAY_AU_ROTATION = "705-53470-19255-0";

export function ebayAffiliate(url: string, customid?: string): string {
  const u = new URL(url);
  u.searchParams.set("mkcid", "1");
  u.searchParams.set("mkrid", EBAY_AU_ROTATION);
  u.searchParams.set("siteid", "15");
  u.searchParams.set("campid", EBAY_CAMPAIGN_ID);
  u.searchParams.set("toolid", "10001");
  u.searchParams.set("mkevt", "1");
  if (customid) u.searchParams.set("customid", customid.slice(0, 256));
  return u.toString();
}

export type EbayCondition = "new" | "used" | "refurbished" | "any";
const CONDITION: Record<EbayCondition, string | null> = { new: "1000", used: "3000", refurbished: "2000|2010|2020|2030|2500", any: null };

/** A search of Australian eBay listings, cheapest with postage first. */
export function ebaySearch(query: string, opts: { condition?: EbayCondition; customid?: string; phones?: boolean } = {}): string {
  const u = new URL("https://www.ebay.com.au/sch/i.html");
  u.searchParams.set("_nkw", query);
  if (opts.phones) u.searchParams.set("_sacat", "9355");
  const c = CONDITION[opts.condition ?? "any"];
  if (c) u.searchParams.set("LH_ItemCondition", c);
  u.searchParams.set("LH_PrefLoc", "1");
  u.searchParams.set("LH_BIN", "1");
  return ebayAffiliate(u.toString(), opts.customid);
}

export const ebayDeals = (customid?: string) => ebayAffiliate("https://www.ebay.com.au/deals/tech", customid);

/** rel for every paid link (Google's rule for affiliate links). */
export const SPONSORED_REL = "noopener nofollow sponsored";
