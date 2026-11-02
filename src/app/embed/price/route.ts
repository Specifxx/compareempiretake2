import { getProduct, getProducts, productHref } from "@/lib/catalog";
import { REGIONS, money } from "@/lib/region";
import { SITE, SITE_NAME } from "@/lib/site";
import { badgeHtml, parseProductPath } from "@/lib/embed";
import type { CategoryId } from "@/lib/types";

// The embeddable price badge (DECISIONS.md, "Free price widgets", 2026-11-02): /embed/price?p=/us/tvs/<slug>.
// A route handler, so it escapes the root layout. It reads ?p, so it renders on request; its only cache is the CDN
// header below (a day, like product pages, and every deploy starts a fresh cache). Only this response may be framed
// (frame-ancestors). No dynamic segment, so the prerender rule for [segments] (tests/routes.test.ts) doesn't apply.
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Robots-Tag": "noindex",
  "Content-Security-Policy": "frame-ancestors *",
};

export function GET(req: Request) {
  const ref = parseProductPath(new URL(req.url).searchParams.get("p"));
  const p = ref ? getProduct(ref.category as CategoryId, ref.slug, ref.region) : undefined;
  if (!p || !ref) {
    // An empty region means the catalogue wasn't traced: fail loudly rather than let the CDN keep a 404.
    if (ref && !getProducts(undefined, ref.region).length) throw new Error(`no catalogue for ${ref.region}`);
    const body = badgeHtml({ site: SITE_NAME, name: "Product not found", meta: "Compare tech prices across stores", price: null, sub: "", href: `${SITE}/?utm_source=embed`, image: null });
    return new Response(body, { status: 404, headers: { ...HEADERS, "Vercel-CDN-Cache-Control": "public, s-maxage=21600" } });
  }
  const R = REGIONS[ref.region];
  const inStock = p.variants.some((v) => v.offers.some((o) => o.inStock));
  const body = badgeHtml({
    site: SITE_NAME,
    name: p.name,
    meta: `${p.brand} · ${R.name}`,
    price: p.bestPrice > 0 ? `from ${money(p.bestPrice, ref.region)}` : null,
    sub: `${p.retailerCount} ${p.retailerCount === 1 ? "store" : "stores"} compared${inStock ? "" : " · out of stock"}`,
    href: `${SITE}${productHref(p)}?utm_source=embed&utm_medium=widget`,
    image: p.image ?? null,
  });
  return new Response(body, { headers: { ...HEADERS, "Vercel-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
}
