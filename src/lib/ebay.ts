/**
 * eBay Partner Network (EPN) links. Every eBay link on the site goes through
 * here so it carries our campaign id. eBay pays a share of the sale when a
 * visitor buys within 24 hours of clicking (and for new eBay sign-ups).
 * customid tells us in EPN reports which page sent the click, and its `ce-`
 * prefix which site: every Compare site uses this one campaign, hard-coded
 * (owner, 2026-10-30), and only the prefix tells them apart.
 */
export const EBAY_CAMPAIGN_ID = "5339155912";
const SITE_TAG = "ce";

/** `ce-<page…>`: the site tag first, so EPN's customid report groups by site. */
export const ebayCustomId = (customid?: string) =>
  !customid ? SITE_TAG : customid.startsWith(`${SITE_TAG}-`) ? customid : `${SITE_TAG}-${customid}`;
/** eBay site per region: EPN rotation id and site id. */
export const EBAY_SITES = {
  au: { host: "www.ebay.com.au", rotation: "705-53470-19255-0", siteid: "15", phonesCat: "9355" },
  us: { host: "www.ebay.com", rotation: "711-53200-19255-0", siteid: "0", phonesCat: "9355" },
  uk: { host: "www.ebay.co.uk", rotation: "710-53481-19255-0", siteid: "3", phonesCat: "9355" },
} as const;
type EbayRegion = keyof typeof EBAY_SITES;

export function ebayAffiliate(url: string, customid?: string, region: EbayRegion = "au"): string {
  const u = new URL(url);
  const site = EBAY_SITES[region];
  u.searchParams.set("mkcid", "1");
  u.searchParams.set("mkrid", site.rotation);
  u.searchParams.set("siteid", site.siteid);
  u.searchParams.set("campid", EBAY_CAMPAIGN_ID);
  u.searchParams.set("toolid", "10001");
  u.searchParams.set("mkevt", "1");
  u.searchParams.set("customid", ebayCustomId(customid).slice(0, 256));
  return u.toString();
}

export type EbayCondition = "new" | "used" | "refurbished" | "any";
const CONDITION: Record<EbayCondition, string | null> = { new: "1000", used: "3000", refurbished: "2000|2010|2020|2030|2500", any: null };

/** A search of Australian eBay listings, cheapest with postage first. */
export function ebaySearch(query: string, opts: { condition?: EbayCondition; customid?: string; phones?: boolean; region?: EbayRegion } = {}): string {
  const region = opts.region ?? "au";
  const u = new URL(`https://${EBAY_SITES[region].host}/sch/i.html`);
  u.searchParams.set("_nkw", query);
  if (opts.phones) u.searchParams.set("_sacat", "9355");
  const c = CONDITION[opts.condition ?? "any"];
  if (c) u.searchParams.set("LH_ItemCondition", c);
  u.searchParams.set("LH_PrefLoc", "1");
  u.searchParams.set("LH_BIN", "1");
  return ebayAffiliate(u.toString(), opts.customid, region);
}

export const ebayDeals = (customid?: string, region: EbayRegion = "au") => ebayAffiliate(`https://${EBAY_SITES[region].host}/deals/tech`, customid, region);

/** rel for every paid link (Google's rule for affiliate links). */
export const SPONSORED_REL = "noopener nofollow sponsored";
