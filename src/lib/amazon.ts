/**
 * Amazon Associates (Australia). Every Amazon link on the site is built here and goes straight
 * to amazon.com.au with our tracking tag: no shorteners, redirects or cloaking.
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
