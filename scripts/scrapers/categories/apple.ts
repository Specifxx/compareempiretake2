/**
 * Apple AU store: iPads (tablets), MacBook Air/Pro/Neo (laptops), Studio Display (monitors).
 * iPad buy pages embed `"products":[{sku,partNumber,price:{fullPrice},name}]` and a JSON-LD Product per
 * screen size whose name carries the chip ("iPad Air 11-inch (M4)") and whose offers list the part numbers.
 * Mac buy pages link one server-rendered page per standard configuration, each with JSON-LD (name, price, part).
 * iMac / Mac mini / Mac Studio (desktops) use the same Mac configuration pages.
 * Apple Watch buy pages carry a `"prices":{"watch_cases-<material>-<size>-<gps|gpscell>":…}` map and link one page per
 * case+band combination; we take one Sport Band (base-price) page per material/size/config for its JSON-LD name/price/part.
 * AirPods, Beats and HomePod come from the headphones-speakers accessory listings (JSON-LD Product per card); each
 * product page lists its colour variants (`"dimensionColor":"…","partNumber":"…"` + colour display names).
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
      const colourIdx = parts.findIndex((p, i) => i > 0 && !/inch|chip|core|memory|storage|display|glass|stand|ethernet|GB$|TB$|^\d+(\.\d+)?["”]$/i.test(p));
      const colour = colourIdx > 0 ? parts.splice(colourIdx, 1)[0] : undefined;
      const title = `Apple ${parts.join(" ").replace(/ Chip/, "")}${colour ? ` - ${colour}` : ""}`
        .replace(/ (\d+(GB|TB)) storage/, " $1 SSD")
        .replace(/^Apple iMac (\d+(?:\.\d+)?)["”]/, "Apple iMac $1-inch")
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

async function desktops(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/au/shop/buy-mac`);
  const models = [...new Set([...index.matchAll(/\/au\/shop\/buy-mac\/(imac[a-z0-9-]*|mac-mini|mac-studio|mac-pro)\b/g)].map((m) => m[1]))];
  return macConfigs(models);
}

const WATCH_COLOUR: Record<string, string> = {
  nightblue: "Night Blue", pearlwhite: "Pearl White", lightgold: "Light Gold", radiantgold: "Radiant Gold", darkbronze: "Dark Bronze",
  jetblack: "Jet Black", rosegold: "Rose Gold", spacegray: "Space Grey", slategray: "Slate", spaceblack: "Space Black",
};
const WATCH_MATERIAL: Record<string, string> = { aluminum: "aluminium", titanium: "titanium", ceramic: "ceramic" };

async function smartwatches(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/au/shop/buy-watch`);
  const models = [...new Set([...index.matchAll(/\/au\/shop\/buy-watch\/(apple-watch[a-z0-9-]*)/g)].map((m) => m[1]))].filter(
    (m) => !/hermes/.test(m),
  );
  const out: RawOffer[] = [];
  const seen = new Set<string>();
  for (const m of models) {
    const url = `${BASE}/au/shop/buy-watch/${m}`;
    const html = await get(url);
    await sleep(800);
    const model = clean(String(jsonLd(html).find((n) => n["@type"] === "Product")?.name ?? "Apple Watch"));
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const price = new Map<string, number>();
    for (const [, k, v] of html.matchAll(/"(watch_cases-[a-z0-9-]+)":\{"fullPrice-short":"A\$([0-9,.]+)"/g))
      price.set(k, Number(v.replace(/,/g, "")));
    const colour = new Map<string, string>();
    for (const [, k, v] of html.matchAll(/"dimensionValue":"([a-z0-9_]+)"[^{}]*?"text":"([^"]+)"/g)) if (!colour.has(k)) colour.set(k, decodeEntities(v));
    // {"part":"MJJD4X/A","dimensions":{CaseSize:"42mm",CaseMaterial:"aluminum",Color:"space_gray",Connection:"gpscell"},"priceKey":"…"}
    // (Ultra omits material and connection: always titanium, GPS + Cellular.)
    for (const [, part, dims, key] of html.matchAll(/\{"part":"([^"]+)","dimensions":(\{[^{}]*\}),"priceKey":"([^"]+)"/g)) {
      let d: Record<string, string>;
      try {
        d = JSON.parse(dims);
      } catch {
        continue;
      }
      const size = d["watch_cases-dimensionCaseSize"];
      const mat = d["watch_cases-dimensionCaseMaterial"] ?? (/ultra/.test(m) ? "titanium" : "aluminum");
      const col = d["watch_cases-dimensionColor"] ?? "";
      const conn = d["watch_cases-dimensionConnection"] ?? (/ultra/.test(m) ? "gpscell" : "gps");
      if (!size) continue;
      const p = price.get(key);
      if (!p || seen.has(part)) continue;
      seen.add(part);
      const material = (WATCH_MATERIAL[mat] ?? mat).replace(/^./, (c) => c.toUpperCase());
      const colourName = (colour.get(col) ?? WATCH_COLOUR[col] ?? col.replace(/_/g, " ").replace(/\b./g, (c) => c.toUpperCase())).replace(/Space Gray/, "Space Grey");
      out.push({
        retailer: "apple",
        sku: part,
        mpn: part,
        brand: "Apple",
        title: `Apple ${model.replace(/^Apple /, "")} ${size} ${conn === "gps" ? "GPS" : "GPS + Cellular"} ${colourName} ${material} Case`,
        url,
        price: p,
        image,
        inStock: true,
      });
    }
  }
  return out;
}

const AUDIO_JUNK = /ear ?tips|cushion|adapter|cable|case\b|cover|strap|mount|stand|charger|\bkit\b/i;

async function audio(kind: "headphones" | "speakers"): Promise<RawOffer[]> {
  const seen = new Map<string, { name: string; url: string; price: number }>();
  for (const f of ["apple", "beats"]) {
    const html = await get(`${BASE}/au/shop/accessories/all/headphones-speakers/${f}`);
    for (const n of jsonLd(html)) {
      if (n["@type"] !== "Product") continue;
      const name = clean(String(n.name));
      const o = (n.offers as { sku?: string; price?: number }[] | undefined)?.[0];
      if (!o?.price || !o.sku || AUDIO_JUNK.test(name)) continue;
      const speaker = /homepod|pill|speaker/i.test(name);
      if ((kind === "speakers") !== speaker) continue;
      seen.set(o.sku, { name, url: String(n.url), price: o.price });
    }
    await sleep(800);
  }
  const out: RawOffer[] = [];
  const done = new Set<string>();
  for (const [sku, p] of seen) {
    if (done.has(sku)) continue;
    let html = "";
    try {
      html = await get(p.url);
      await sleep(700);
    } catch {}
    // Colour display names: "starlight":{"value":"Starlight",…
    const colourName = new Map<string, string>();
    for (const [, k, v] of html.matchAll(/"([a-z0-9_-]+)":\{"value":"([^"]+)","image"/g)) colourName.set(k, decodeEntities(v));
    const variants = [...html.matchAll(/"dimensionColor":"([^"]+)","partNumber":"([^"]+)"[^{}]*?"seoUrlToken":"([^"]*)"/g)];
    const base = p.name.split(/ [—–-] (?=[^—–-]*$)/)[0];
    const hasColour = base !== p.name;
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const brand = /beats/i.test(p.name) ? "Beats" : "Apple";
    const list = hasColour && variants.length ? variants.map((v) => ({ part: v[2], colour: colourName.get(v[1]) ?? v[1].replace(/-/g, " "), token: v[3] })) : [{ part: sku, colour: "", token: "" }];
    for (const v of list) {
      if (done.has(v.part)) continue;
      done.add(v.part);
      const title = v.colour ? `${base} — ${v.colour}` : p.name;
      out.push({
        retailer: "apple",
        sku: v.part,
        mpn: v.part,
        brand,
        title: brand === "Apple" && !/^Apple/.test(title) ? `Apple ${title}` : title,
        url: v.token ? p.url.replace(/\/a\/[^/]*$/, `/a/${v.token}`).replace(/\/[a-z0-9]+\/a\//, `/${v.part.toLowerCase().replace("/a", "")}/a/`) : p.url,
        price: p.price,
        image,
        inStock: true,
      });
    }
  }
  return out;
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
  desktops,
  smartwatches,
  headphones: () => audio("headphones"),
  speakers: () => audio("speakers"),
};
