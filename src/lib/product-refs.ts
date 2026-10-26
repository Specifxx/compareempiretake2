/**
 * Product page paths as the compare tray and saved list store them ("/phones/apple-iphone-17-pro",
 * "/us/tvs/lg-oled-evo-c5-65"), and the query /api/products takes. Pure, so the browser builds
 * exactly the requests the endpoint accepts, and tests/client-data.test.ts can pin the rules.
 */
import { CATEGORIES } from "./categories";
import type { RegionId } from "./region";
import type { CategoryId } from "./types";

/** An optional region prefix, a category id and a slug: nothing else gets near the catalogue. */
export const PRODUCT_HREF = /^(?:\/(us|uk))?\/([a-z-]+)\/([a-z0-9-]+)$/;
/** Products per request (the saved list holds up to 100, so it asks in two or more). */
export const MAX_REFS = 50;
/** The longest product path today is 189 characters. */
export const MAX_HREF = 256;
/** Characters of `p` per request, well inside URL limits (Vercel's is 14 KB). */
export const MAX_QUERY = 6000;
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export interface ProductRef {
  href: string;
  region: RegionId;
  category: CategoryId;
  slug: string;
}

export function parseHref(href: string): ProductRef | null {
  if (href.length > MAX_HREF) return null;
  const m = PRODUCT_HREF.exec(href);
  if (!m || !CATEGORY_IDS.has(m[2])) return null;
  return { href, region: (m[1] ?? "au") as RegionId, category: m[2] as CategoryId, slug: m[3] };
}

/** Lists saved before product paths were stored hold bare phone slugs ("apple-iphone-17"). */
export const normaliseHref = (s: string) => (s.startsWith("/") ? s : `/phones/${s}`);

/**
 * What the compare table holds one of at a time: a region and a category ("us/tvs"). Its rows,
 * prices and "add a product" search are the first product's. Null for a path that is no product.
 */
export function compareGroup(s: string): string | null {
  const r = parseHref(normaliseHref(s));
  return r ? `${r.region}/${r.category}` : null;
}

/** "full": whole products (the compare table); "summary": what a product card shows (the saved list). */
export type ProductView = "full" | "summary";

export type ProductQuery = { ok: true; refs: ProductRef[]; view: ProductView } | { ok: false; error: string };

/**
 * `p` is a comma-separated list of product paths, `view` is absent, "full" or "summary". Anything
 * else is refused as a whole, with a fixed message: the input is never echoed back.
 */
export function parseProductQuery(p: string | null, view: string | null): ProductQuery {
  if (view !== null && view !== "full" && view !== "summary") return { ok: false, error: "view must be full or summary" };
  if (!p) return { ok: false, error: "p is required" };
  if (p.length > MAX_QUERY) return { ok: false, error: "too many products" };
  const hrefs = [...new Set(p.split(",").filter(Boolean))];
  if (!hrefs.length) return { ok: false, error: "p is required" };
  if (hrefs.length > MAX_REFS) return { ok: false, error: "too many products" };
  const refs: ProductRef[] = [];
  for (const h of hrefs) {
    const r = parseHref(h);
    if (!r) return { ok: false, error: "p must list product paths like /phones/apple-iphone-17-pro" };
    refs.push(r);
  }
  return { ok: true, refs, view: view === "summary" ? "summary" : "full" };
}

/**
 * The requests for some products: valid paths only, deduplicated and sorted (so one set is one CDN
 * key), split so each stays within MAX_REFS and MAX_QUERY.
 */
export function productsUrls(hrefs: string[], view: ProductView): { url: string; hrefs: string[] }[] {
  const out: { url: string; hrefs: string[] }[] = [];
  let chunk: string[] = [];
  let length = 0;
  const flush = () => {
    if (chunk.length) out.push({ url: `/api/products?p=${chunk.join(",")}${view === "summary" ? "&view=summary" : ""}`, hrefs: chunk });
    chunk = [];
    length = 0;
  };
  for (const h of [...new Set(hrefs)].filter((x) => parseHref(x)).sort()) {
    if (chunk.length >= MAX_REFS || length + h.length + 1 > MAX_QUERY) flush();
    chunk.push(h);
    length += h.length + 1;
  }
  flush();
  return out;
}
