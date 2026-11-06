/**
 * Motorola US (motorola.com/us/en): phones and the Moto Watch. The listing pages (/us/en/smartphones) carry the
 * product links but no prices; each product page (/us/en/p/phones/<line>/<model>/<code>) is server-rendered with a
 * schema.org Product (USD price, availability) and its configurator data names the storage
 * ("MOTO_INTERNAL_STORAGE","name":"256GB"). Written 2026-11-06 from GitHub Actions probes (200, no key; the price
 * API the page calls is not used). A page that offers more than one storage is skipped: its one JSON-LD price
 * can't say which storage it is. Motorola US sells unlocked phones only.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

const BASE = "https://www.motorola.com";

function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}
function products(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      for (const n of walk(JSON.parse(body))) if (String(n["@type"]).toLowerCase() === "product") out.push(n);
    } catch {}
  }
  return out;
}

async function links(listings: string[], under: RegExp): Promise<string[]> {
  const found = new Set<string>();
  for (const l of listings) {
    try {
      const html = await get(`${BASE}/us/en/${l}`);
      for (const [, p] of html.matchAll(/(\/us\/en\/p\/[a-z0-9/_-]+)/g)) if (under.test(p)) found.add(p.replace(/\/$/, ""));
    } catch {}
    await sleep(900);
  }
  return [...found];
}

async function read(paths: string[], cat: "phones" | "smartwatches"): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    const url = BASE + path;
    let html: string;
    try {
      html = await get(url, 2);
    } catch {
      continue;
    }
    await sleep(900);
    const node = products(html)[0];
    if (!node) continue;
    const offer = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
    if (!offer || (offer.priceCurrency && offer.priceCurrency !== "USD")) continue;
    const price = Number(offer.price);
    if (!price) continue;
    const raw = decodeEntities(String(node.name ?? "")).replace(/[™®]/g, "").replace(/\s+-\s+/g, " ").replace(/\s+/g, " ").trim();
    if (!raw || /refurb|renewed|pre-?owned|bundle|case|charger|earbuds|buds/i.test(raw)) continue;
    const model = raw.replace(/^motorola\s+/i, "");
    let title: string;
    if (cat === "phones") {
      const storages = new Set([...html.matchAll(/"MOTO_INTERNAL_STORAGE","name":"(\d+\s?(?:GB|TB))"/g)].map((m) => m[1].replace(/\s/g, "").toUpperCase()));
      if (storages.size !== 1) continue;
      title = `Motorola ${model} ${[...storages][0]}`;
    } else {
      if (!/watch/i.test(raw)) continue;
      title = `Motorola ${model}`;
    }
    const sku = String(node.sku ?? node.mpn ?? path.split("/").pop());
    if (seen.has(sku)) continue;
    seen.add(sku);
    const image = Array.isArray(node.image) ? node.image.find((x) => typeof x === "string") : typeof node.image === "string" ? node.image : undefined;
    out.push({
      retailer: "us-motorola",
      sku,
      mpn: typeof node.mpn === "string" ? node.mpn : undefined,
      brand: "Motorola",
      title,
      url,
      price,
      image: image as string | undefined,
      inStock: /InStock/i.test(String(offer.availability ?? "")),
    });
  }
  return out;
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  phones: async () => read(await links(["smartphones", "smartphones-razr", "smartphones-moto-g", "smartphones-motorola-edge"], /^\/us\/en\/p\/phones\//), "phones"),
  smartwatches: async () => read(await links(["smartphones", "wearables"], /^\/us\/en\/p\/wearables\//), "smartwatches"),
};
