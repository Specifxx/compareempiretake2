/**
 * Dell UK: laptops, desktops (same card layout as laptops) and monitors from the server-rendered listing pages (?page=N).
 * Each page carries `Dell.ProductStack.GlobalSetting.ProductsDetailInfo = JSON.parse("…")` (title, dellPrice,
 * marketPrice, pdUrl per card) plus the card HTML. Laptop "variant-stack" cards are model families priced
 * "from"; "stack-system" cards are fixed configurations whose hero specs (CPU, RAM, SSD, screen) we put in the title.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

const money = (s: unknown) => Number(String(s ?? "").replace(/[^0-9.]/g, "")) || undefined;
const tidy = (s: string) => decodeEntities(s).replace(/[®™\u200b\u200c\u200d\ufeff]/g, "").replace(/\s+/g, " ").trim();

type Detail = { productId: string; title: string; image?: string; dellPrice?: string; marketPrice?: string | null; pdUrl?: string; snpStockStatus?: number };

function parsePage(raw: string) {
  const m = raw.match(/ProductsDetailInfo = JSON\.parse\("((?:[^"\\]|\\.)*)"\)/);
  let details: Record<string, Detail> = {};
  if (m) {
    try {
      details = JSON.parse(JSON.parse(`"${m[1]}"`));
    } catch {}
  }
  const html = raw
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ");
  const cards = html.split("<article ").slice(1).map((a) => ({
    id: a.match(/^id="([^"]+)"/)?.[1] ?? "",
    type: a.match(/data-stack-type="([^"]+)"/)?.[1] ?? "",
    url: a.match(/class="ps-title"[^>]*>\s*<a[^>]*href="([^"]+)"/)?.[1],
    title: a.match(/class="ps-title"[^>]*>\s*<a[^>]*>([^<]+)/)?.[1],
    price: money(a.match(/ps-dell-price-amount[^>]*>\s*([^<]+)/)?.[1]),
    was: money(a.match(/ps-strike-through[^>]*>[^£&]*?(?:£|&#xA3;)([0-9,.]+)/)?.[1]),
    image: a.match(/<img[^>]+src="(https:\/\/i\.dell\.com[^"]+)"/)?.[1],
    specs: [...a.matchAll(/class="spec-label">([^<]*)/g)].map((x) => tidy(x[1])),
  }));
  return { details, cards };
}

async function crawl(listing: string) {
  const details = new Map<string, Detail>();
  const cards = new Map<string, ReturnType<typeof parsePage>["cards"][number]>();
  for (let page = 1; page <= 20; page++) {
    let raw: string;
    try {
      raw = await get(`${listing}${page > 1 ? `?page=${page}` : ""}`, page > 1 ? 2 : 4);
    } catch (e) {
      if (page === 1) throw e;
      break; // Dell answers 500 past the last page
    }
    const p = parsePage(raw);
    const before = details.size + cards.size;
    for (const [k, v] of Object.entries(p.details)) details.set(k, v);
    for (const c of p.cards) if (c.id && !cards.has(c.id)) cards.set(c.id, c);
    if (details.size + cards.size === before) break;
    await sleep(1200);
  }
  return { details, cards };
}

const BAD = /refurb|renewed|open.?box|keyboard|mouse|dock|stand|mount|bag|backpack|adapter|cable|speakerphone|headset/i;

async function laptops(listing = "https://www.dell.com/en-gb/shop/laptops/scr/laptop"): Promise<RawOffer[]> {
  const { details, cards } = await crawl(listing);
  const out: RawOffer[] = [];
  for (const c of cards.values()) {
    const d = details.get(c.id);
    const name = tidy(d?.title ?? c.title ?? "");
    const price = c.price ?? money(d?.dellPrice);
    if (!name || !price || BAD.test(name)) continue;
    const brandName = /^(dell|alienware)/i.test(name) ? name : `Dell ${name}`;
    const fixed = c.type === "stack-system" && c.specs.length > 0;
    const cpu = c.specs.find((s) => /core|ryzen|snapdragon|processor/i.test(s))?.replace(/,\s*\d+ cores?/i, "");
    const ram = c.specs.find((s) => /^\d+ ?GB\b(?!.*SSD)/i.test(s));
    const ssd = c.specs.find((s) => /SSD/i.test(s))?.replace(/,.*$/, "");
    const screen = c.specs.find((s) => /^\d+(\.\d+)?"/.test(s));
    if (/monitor/i.test(name) && !/all-in-one|desktop|tower/i.test(name)) continue;
    const title = fixed ? `${brandName} - ${[cpu, ram, ssd, screen].filter(Boolean).join(", ")}` : brandName;
    out.push({
      retailer: "uk-dell",
      sku: c.id,
      brand: /alienware/i.test(name) ? "Alienware" : "Dell",
      title,
      url: c.url ?? d?.pdUrl ?? listing,
      price,
      wasPrice: c.was && c.was > price ? c.was : money(d?.marketPrice),
      image: c.image ?? d?.image,
      inStock: true,
      ...(fixed ? {} : { fromPrice: true }),
    });
  }
  return out;
}

async function monitors(): Promise<RawOffer[]> {
  const { details, cards } = await crawl("https://www.dell.com/en-gb/shop/pc-accessories/ar/computer-monitors");
  const out: RawOffer[] = [];
  const ids = new Set([...details.keys(), ...cards.keys()]);
  for (const id of ids) {
    const d = details.get(id);
    const c = cards.get(id);
    const name = tidy(d?.title ?? c?.title ?? "");
    const price = money(d?.dellPrice) ?? c?.price;
    if (!name || !price || !/monitor|display/i.test(name) || BAD.test(name.replace(/stand/i, ""))) continue;
    // "Dell 27 Plus 4K USB-C Monitor - S2725QC"
    const mpn = name.match(/ [-–] ([A-Z]{1,3}\d{4}[A-Z0-9]*)$/)?.[1];
    const was = money(d?.marketPrice);
    out.push({
      retailer: "uk-dell",
      sku: id,
      mpn,
      brand: /alienware/i.test(name) ? "Alienware" : "Dell",
      title: name,
      url: d?.pdUrl ?? c?.url ?? "https://www.dell.com/en-gb/shop/pc-accessories/ar/computer-monitors",
      price,
      wasPrice: was && was > price ? was : undefined,
      image: d?.image ?? c?.image,
      inStock: true,
    });
  }
  return out;
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  laptops: () => laptops(),
  desktops: () => laptops("https://www.dell.com/en-gb/shop/desktop-computers/scr/desktop"),
  monitors,
};
