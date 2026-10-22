/**
 * Apple AU store: iPads (tablets), MacBook Air/Pro/Neo (laptops), Studio Display (monitors).
 * iPad buy pages embed `"products":[{sku,partNumber,price:{fullPrice},name}]` and a JSON-LD Product per
 * screen size whose name carries the chip ("iPad Air 11-inch (M4)") and whose offers list the part numbers.
 * Mac buy pages link one server-rendered page per standard configuration, each with JSON-LD (name, price, part).
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, pool, sleep } from "../../lib/http";

const BASE = "https://www.apple.com";

function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(body);
      for (const x of Array.isArray(d) ? d : [d]) out.push(x);
    } catch {}
  }
  return out;
}

const clean = (s: string) =>
  decodeEntities(s)
    .replace(/[ ‑‐]/g, (c) => (c === " " ? " " : "-"))
    .replace(/Space Gray/g, "Space Grey")
    .replace(/\s+/g, " ")
    .trim();

type Product = { sku: string; partNumber: string; name: string; category?: string; price?: { fullPrice?: number } };

function products(html: string): Product[] {
  const out: Product[] = [];
  for (const [, block] of html.matchAll(/"products":(\[\{"sku".*?\}\])/g)) {
    try {
      out.push(...(JSON.parse(block) as Product[]));
    } catch {}
  }
  return out;
}

async function tablets(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/au/shop/buy-ipad`);
  const models = [...new Set([...index.matchAll(/\/au\/shop\/buy-ipad\/(ipad[a-z0-9-]*)/g)].map((m) => m[1]))];
  const out: RawOffer[] = [];
  const seen = new Set<string>();
  for (const m of models) {
    const url = `${BASE}/au/shop/buy-ipad/${m}`;
    let html: string;
    try {
      html = await get(url);
    } catch {
      continue;
    }
    // part number -> JSON-LD model name with chip
    const ldName = new Map<string, string>();
    for (const node of jsonLd(html)) {
      if (node["@type"] !== "Product") continue;
      for (const o of (node.offers as { sku?: string }[]) ?? []) if (o.sku) ldName.set(o.sku, clean(String(node.name)));
    }
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    for (const p of products(html)) {
      if (p.category && p.category !== "ipad") continue;
      const price = p.price?.fullPrice;
      const name = clean(p.name);
      const rest = name.match(/(Wi-Fi.*)$/)?.[1];
      if (!price || !rest || seen.has(p.partNumber)) continue;
      // Model name from JSON-LD ("iPad Air 11-inch (M4)"); fall back to the product name's model part.
      const model = ldName.get(p.partNumber) ?? name.slice(0, name.indexOf(rest)).trim();
      if (!/\d+(\.\d+)?-inch|mini|\(A1\d/.test(model) && !/inch/.test(name)) continue;
      seen.add(p.partNumber);
      out.push({
        retailer: "apple",
        sku: p.partNumber,
        mpn: p.partNumber,
        brand: "Apple",
        title: `Apple ${model} ${rest.replace(/ with (standard|nano-texture) glass/i, (_, g) => ` ${g[0].toUpperCase()}${g.slice(1)} Glass`)}`.replace(/\s+/g, " "),
        url,
        price,
        image,
        inStock: true,
      });
    }
    await sleep(800);
  }
  return out;
}

async function macConfigs(models: string[]): Promise<RawOffer[]> {
  const urls: string[] = [];
  for (const m of models) {
    const html = await get(`${BASE}/au/shop/buy-mac/${m}`);
    const re = new RegExp(`https://www\\.apple\\.com/au/shop/buy-mac/${m}/[a-z0-9-]+`, "g");
    for (const u of new Set(html.match(re) ?? [])) urls.push(u);
    await sleep(800);
  }
  const res = await pool([...new Set(urls)], 2, async (url) => {
    try {
      const html = await get(url);
      await sleep(600);
      const node = jsonLd(html).find((n) => n["@type"] === "Product");
      const offer = (node?.offers as { sku?: string; price?: number }[] | undefined)?.[0];
      if (!node || !offer?.price || !offer.sku) return undefined;
      const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      // "MacBook Air, 13-inch, M5 Chip, 10-core CPU, 8-core GPU, Midnight, 16GB memory, 512GB storage"
      const parts = clean(String(node.name)).split(/,\s*/);
      const colourIdx = parts.findIndex((p, i) => i > 0 && !/inch|chip|core|memory|storage|display|GB$|TB$/i.test(p));
      const colour = colourIdx > 0 ? parts.splice(colourIdx, 1)[0] : undefined;
      const title = `Apple ${parts.join(" ").replace(/ Chip/, "")}${colour ? ` - ${colour}` : ""}`
        .replace(/ (\d+(GB|TB)) storage/, " $1 SSD")
        .replace(/\s+/g, " ");
      return {
        retailer: "apple",
        sku: offer.sku,
        mpn: offer.sku,
        brand: "Apple",
        title,
        url,
        price: offer.price,
        image,
        inStock: true,
      } as RawOffer;
    } catch {
      return undefined;
    }
  });
  return res.filter((x) => !!x) as RawOffer[];
}

async function laptops(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/au/shop/buy-mac`);
  const models = [...new Set([...index.matchAll(/\/au\/shop\/buy-mac\/(macbook[a-z0-9-]*)/g)].map((m) => m[1]))];
  return macConfigs(models);
}

async function monitors(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/au/shop/buy-mac`);
  const models = [
    ...new Set([...index.matchAll(/\/au\/shop\/buy-mac\/((?:studio|pro)-display[a-z0-9-]*)/g)].map((m) => m[1])),
  ];
  const out: RawOffer[] = [];
  for (const m of models) {
    const url = `${BASE}/au/shop/buy-mac/${m}`;
    const html = await get(url);
    const size = html.match(/(\d+(?:\.\d+)?)-inch/)?.[1] ?? "27";
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    for (const p of products(html)) {
      if (!p.price?.fullPrice) continue;
      const [model, ...opts] = clean(p.name).split(" - ");
      out.push({
        retailer: "apple",
        sku: p.partNumber,
        mpn: p.partNumber,
        brand: "Apple",
        title: `Apple ${model} ${size}-inch${opts.length ? ` - ${opts.join(" - ")}` : ""}`,
        url,
        price: p.price.fullPrice,
        image,
        inStock: true,
      });
    }
    await sleep(800);
  }
  return out;
}

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  tablets,
  laptops,
  monitors,
};
