/** One store's price on a share card: store name and price, in the region's own currency. */
export interface ShareRow { s: string; p: number }

/**
 * URL of the share card for a page (see src/app/og/route.tsx). Everything the card draws travels in the query
 * string, so the card renders without loading the catalogue; when prices change the URL changes, and the CDN
 * keeps each card a day.
 */
export function ogImage(o: {
  title: string;
  price?: number;
  stores?: number;
  verdict?: string;
  image?: string;
  category?: string;
  region?: "au" | "us" | "uk";
  /** The product the store rows are for (the card's comparison panel). */
  product?: string;
  /** Real in-stock store prices for `product`, cheapest first (shareRows in src/lib/share-rows.ts). */
  rows?: ShareRow[];
  /** Up to three more product photos, drawn as tiles under the headline (home and category cards). */
  extra?: string[];
  /** "home" draws the brand-first layout: the big headline is the site's promise, not a product. */
  kind?: "home" | "category" | "product";
}): string {
  const q = new URLSearchParams();
  q.set("t", o.title);
  if (o.price) q.set("p", String(Math.round(o.price)));
  if (o.stores) q.set("s", String(o.stores));
  if (o.verdict) q.set("v", o.verdict);
  if (o.image?.startsWith("https://")) q.set("i", o.image);
  if (o.category) q.set("c", o.category);
  if (o.region && o.region !== "au") q.set("r", o.region);
  if (o.product) q.set("n", o.product.slice(0, 70));
  if (o.rows?.length) q.set("d", o.rows.slice(0, 4).map((r) => `${r.s.replace(/[~|]/g, " ").slice(0, 26)}~${r.p}`).join("|"));
  for (const x of (o.extra ?? []).filter((u) => u.startsWith("https://")).slice(0, 3)) q.append("x", x);
  if (o.kind) q.set("k", o.kind);
  return `/og?${q}`;
}

/** Parses the `d` parameter written by ogImage. Bad entries are dropped, never guessed. */
export function parseRows(d: string | null): ShareRow[] {
  if (!d) return [];
  return d
    .split("|")
    .map((e) => {
      const [s, p] = e.split("~");
      return { s: (s ?? "").trim().slice(0, 26), p: Number(p) };
    })
    .filter((r) => r.s && Number.isFinite(r.p) && r.p > 0)
    .slice(0, 4);
}
