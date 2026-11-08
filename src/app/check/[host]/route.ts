import { getProducts, liveRegions, productHref, regionUpdatedAt } from "@/lib/catalog";
import { linkPath, medianCents, normaliseHost, variantOf, type CheckOffer, type CheckProduct, type StoreCheck } from "@/lib/link-check";
import { REGIONS, type RegionId } from "@/lib/region";
import { RETAILERS } from "@/lib/retailers";

/**
 * /check/<host>: one store's listings, for the "Is this a good price?" checker (components/LinkChecker.tsx, 2026-11-08). The
 * visitor pastes a product link; the browser fetches this file for that link's host and finds the listing. Each product key is
 * "<region>:<category>/<slug>:<variant>" (a 256GB and a 512GB are two prices), with the cheapest and median in-stock outright
 * store price in that region (carrier plans never count). One static file per host our listings link to, built with the deploy
 * like /api/grid: never a function, any other host a 404, and the store's page is never fetched.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

type Built = { offers: CheckOffer[]; products: Record<string, CheckProduct>; regions: Map<RegionId, number>; stores: Map<string, number> };
let built: Map<string, Built> | null = null;

function build(): Map<string, Built> {
  if (built) return built;
  const byHost = new Map<string, Built>();
  for (const region of liveRegions()) {
    for (const p of getProducts(undefined, region)) {
      for (const v of p.variants) {
        const outright = v.offers.filter((o) => o.kind !== "plan");
        if (!outright.length) continue;
        const open = outright.filter((o) => o.inStock);
        const prices = open.map((o) => Math.round(o.price * 100));
        const key = `${region}:${p.category}/${p.slug}:${v.id}`;
        const product: CheckProduct = {
          name: p.variants.length > 1 ? `${p.name} ${v.label}` : p.name,
          href: productHref(p),
          cheapestCents: prices.length ? Math.min(...prices) : null,
          medianCents: prices.length >= 2 ? medianCents(prices) : null,
          inStockStores: new Set(open.map((o) => o.retailer)).size,
          listedStores: new Set(outright.map((o) => o.retailer)).size,
        };
        for (const o of outright) {
          let url: URL;
          try {
            url = new URL(o.url);
          } catch {
            continue;
          }
          const host = normaliseHost(url.hostname);
          let b = byHost.get(host);
          if (!b) byHost.set(host, (b = { offers: [], products: {}, regions: new Map(), stores: new Map() }));
          b.products[key] = product;
          b.offers.push([linkPath(url.pathname), key, Math.round(o.price * 100), o.inStock ? 1 : 0, variantOf(o.url)]);
          b.regions.set(region, (b.regions.get(region) ?? 0) + 1);
          b.stores.set(o.retailer, (b.stores.get(o.retailer) ?? 0) + 1);
        }
      }
    }
  }
  return (built = byHost);
}

const most = <K,>(m: Map<K, number>): K => [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];

export const generateStaticParams = () => [...build().keys()].map((host) => ({ host }));

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const host = normaliseHost(decodeURIComponent((await params).host));
  const b = build().get(host);
  if (!b) return new Response("Not found", { status: 404 });
  const store = most(b.stores);
  const region = most(b.regions);
  const body: StoreCheck = {
    v: 1,
    store,
    name: RETAILERS[store as keyof typeof RETAILERS]?.name ?? host,
    region,
    currency: REGIONS[region].currency,
    checkedAt: regionUpdatedAt(region) ?? null,
    offers: b.offers,
    products: b.products,
  };
  return Response.json(body, { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
