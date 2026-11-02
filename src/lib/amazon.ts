/**
 * Amazon Associates. Every Amazon link on the site is built here and goes straight to the region's
 * Amazon with that store's tracking tag: no shorteners, redirects or cloaking. A tag earns only on
 * the Amazon whose Associates account issued it: compareempire-22 (the owner's AU account) on
 * amazon.com.au, riftcompare-20 (the owner's US account) on amazon.com. The UK has no account yet,
 * so Amazon UK shows only once NEXT_PUBLIC_AMAZON_UK_TAG is set: an untagged link earns nothing.
 *
 * We have no Product Advertising API access yet, so we never show Amazon prices, ratings or
 * availability: links say "Check price on Amazon". Links carry rel="sponsored nofollow noopener".
 */
export const AMAZON_AU_TAG = process.env.AMAZON_AU_TAG || "compareempire-22";
export const AMAZON_REL = "sponsored nofollow noopener";
export const AMAZON_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";

const ASIN = /^[A-Z0-9]{10}$/;

/** A product page when we know the ASIN, otherwise an Amazon AU search for the term. */
export function amazonAuLink(asinOrSearchTerm: string): string {
  const v = asinOrSearchTerm.trim();
  if (ASIN.test(v)) return `https://www.amazon.com.au/dp/${v}?tag=${encodeURIComponent(AMAZON_AU_TAG)}`;
  return `https://www.amazon.com.au/s?k=${encodeURIComponent(v)}&tag=${encodeURIComponent(AMAZON_AU_TAG)}`;
}

export type AmazonRegion = "au" | "us" | "uk";

// NEXT_PUBLIC_ so the client components (region is picked in the browser) get the same tag; read
// with literal names so Next inlines them at build.
const TAGS: Record<AmazonRegion, string> = {
  au: AMAZON_AU_TAG,
  us: (process.env.NEXT_PUBLIC_AMAZON_US_TAG || "riftcompare-20").trim(),
  uk: (process.env.NEXT_PUBLIC_AMAZON_UK_TAG || "").trim(),
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
