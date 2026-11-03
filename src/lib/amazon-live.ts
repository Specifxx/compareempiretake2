import "server-only";
/**
 * What a product page may show of Amazon, per variant: the ASIN's own tagged link (data/amazon/asins-au.json,
 * written by scripts/amazon-asins.ts; ASINs may be stored), and, only while under 24 hours old, the price the
 * build fetched from the Creators API (data/amazon-live/<region>.json, git-ignored, never committed: Amazon's
 * licence lets a price be kept 24 hours and shown with its time). Read only by the product page: never by a
 * sort, the cheapest badge, deals, alerts, history, feeds, metadata, JSON-LD or the quick view.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { amazonLink, isFreshAmazonPrice as isFresh, type AmazonRegion } from "./amazon";
import type { Phone } from "./types";

export interface AmazonLive { asin: string; url: string; price?: number; at?: string }
type AsinFile = Record<string, { asin: string | null; checked: string }>;
type LiveFile = { fetchedAt: string; prices: Record<string, { asin: string; amount: number }> };

export const asinFile = (region: AmazonRegion) => path.join(process.cwd(), "data", "amazon", `asins-${region}.json`);
export const liveFile = (region: AmazonRegion) => path.join(process.cwd(), "data", "amazon-live", `${region}.json`);
export const amazonKey = (p: Pick<Phone, "category" | "slug">, variantId: string) => `${p.category}/${p.slug}/${variantId}`;

const cache = new Map<string, { asins: AsinFile; live: LiveFile | null }>();
function files(region: AmazonRegion) {
  let c = cache.get(region);
  if (!c) {
    const read = <T,>(f: string): T | null => {
      try {
        return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : null;
      } catch {
        return null;
      }
    };
    c = { asins: read<AsinFile>(asinFile(region)) ?? {}, live: read<LiveFile>(liveFile(region)) };
    cache.set(region, c);
  }
  return c;
}

/** The product's Amazon per variant id (only variants with a known ASIN). Only AU has API access. */
export function amazonFor(p: Pick<Phone, "category" | "slug" | "variants">, region: AmazonRegion, now = Date.now()): Record<string, AmazonLive> | undefined {
  if (region !== "au") return undefined;
  const { asins, live } = files(region);
  const fresh = live && isFresh(live.fetchedAt, now);
  const out: Record<string, AmazonLive> = {};
  for (const v of p.variants) {
    const k = amazonKey(p, v.id);
    const asin = asins[k]?.asin;
    if (!asin) continue;
    const l = fresh ? live!.prices[k] : undefined;
    const url = amazonLink(region, asin, "product-asin")!;
    out[v.id] = l && l.asin === asin ? { asin, url, price: l.amount, at: live!.fetchedAt } : { asin, url };
  }
  return Object.keys(out).length ? out : undefined;
}
