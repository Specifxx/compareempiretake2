// Store photos at the size they are drawn (2026-11-18, "Speed up sites on mobile"). Most catalogue photos are hotlinked
// from Shopify's CDN at full resolution (often 2,000 px and several hundred KB), and a phone drew them in a 160 px tile:
// the product page read 1.5 MB before its largest paint (Lighthouse mobile, score 68). The CDNs that resize on request
// (Shopify `width`, imgix and Contentful `w`) are asked for the drawn width at 2x; any other host is left as it is.
// Display only: never a key, a match or a stored URL.

/** The same photo, asked for at `px` CSS pixels wide (twice that in real pixels, for phone screens). */
export function sized(url: string | null | undefined, px: number): string {
  if (!url) return url ?? "";
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  const w = String(Math.round(px * 2));
  if (u.hostname === "cdn.shopify.com" || u.pathname.includes("/cdn/shop/")) {
    u.searchParams.delete("height");
    u.searchParams.delete("crop");
    u.searchParams.set("width", w);
    return u.toString();
  }
  if (u.hostname.endsWith(".imgix.net") || u.hostname === "images.ctfassets.net") {
    u.searchParams.delete("h");
    u.searchParams.set("w", w);
    return u.toString();
  }
  return url;
}
