/**
 * Amazon Associates. Every Amazon link on the site is built here and goes straight to the region's
 * Amazon with that store's tracking tag: no shorteners, redirects or cloaking. A tag earns only on
 * the Amazon whose Associates account issued it: compareempire-22 (the owner's AU account) on
 * amazon.com.au, riftcompare-20 (the owner's US account) on amazon.com, compareempi03-21 (the owner's
 * UK account) on amazon.co.uk. Hard-coded (owner, 2026-11-02: no Vercel variable decides a tag).
 *
 * Prices: only from the Creators API, only in Australia, only on the product page's Amazon row and only
 * while under 24 hours old (lib/amazon-live.ts, DECISIONS 2026-11-03). Until the API opens to the account,
 * links say "Check price on Amazon". No ratings, ever. Links carry rel="sponsored nofollow noopener".
 */
export const AMAZON_AU_TAG = "compareempire-22";
export const AMAZON_REL = "sponsored nofollow noopener";
export const AMAZON_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";
/** Amazon's trademark notice (Operating Agreement Dos and Don'ts, 2026-11-02), in the footer of every page. */
export const AMAZON_TRADEMARK = "Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.";

const ASIN = /^[A-Z0-9]{10}$/;

/** A product page when we know the ASIN, otherwise an Amazon AU search for the term. */
export function amazonAuLink(asinOrSearchTerm: string): string {
  const v = asinOrSearchTerm.trim();
  if (ASIN.test(v)) return `https://www.amazon.com.au/dp/${v}?tag=${encodeURIComponent(AMAZON_AU_TAG)}`;
  return `https://www.amazon.com.au/s?k=${encodeURIComponent(v)}&tag=${encodeURIComponent(AMAZON_AU_TAG)}`;
}

export type AmazonRegion = "au" | "us" | "uk";

const TAGS: Record<AmazonRegion, string> = {
  au: AMAZON_AU_TAG,
  us: "riftcompare-20",
  uk: "compareempi03-21",
};
const STORES: Record<AmazonRegion, { host: string; name: string }> = {
  au: { host: "www.amazon.com.au", name: "Amazon AU" },
  us: { host: "www.amazon.com", name: "Amazon US" },
  uk: { host: "www.amazon.co.uk", name: "Amazon UK" },
};
const TAG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/i;

/** The region's Amazon (host, name, tag), or null where it has no tag (no link at all there). */
export function amazonStore(region: AmazonRegion): { host: string; name: string; tag: string } | null {
  const tag = TAGS[region];
  return TAG_RE.test(tag) ? { ...STORES[region], tag } : null;
}

/**
 * The region's tagged Amazon link (product page for an ASIN, else a search), or null where the
 * region has no tag. `placement` adds ascsubtag=ce-<region>-<placement>, which splits Associates'
 * reports by site: riftcompare-20 is shared with RiftCompare.
 */
export function amazonLink(region: AmazonRegion, asinOrSearchTerm: string, placement?: string): string | null {
  const a = amazonStore(region);
  if (!a) return null;
  const v = asinOrSearchTerm.trim();
  const sub = placement ? `&ascsubtag=${encodeURIComponent(`ce-${region}-${placement}`.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 60))}` : "";
  if (ASIN.test(v)) return `https://${a.host}/dp/${v}?tag=${encodeURIComponent(a.tag)}${sub}`;
  return `https://${a.host}/s?k=${encodeURIComponent(v)}&tag=${encodeURIComponent(a.tag)}${sub}`;
}

/** Amazon's licence: a Creators API price may be shown for 24 hours after it was fetched, with that time. */
export const AMAZON_MAX_AGE_H = 24;
/** Whether a price fetched at `at` may still be shown at `now`. */
export const isFreshAmazonPrice = (at: string | undefined, now = Date.now()) =>
  !!at && Number.isFinite(Date.parse(at)) && now - Date.parse(at) < AMAZON_MAX_AGE_H * 3600_000 && Date.parse(at) <= now + 60_000;
