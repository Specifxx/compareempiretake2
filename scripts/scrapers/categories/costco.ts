import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

const BASE = "https://www.costco.com.au";

const JUNK = /refurb|renewed|open[- ]?box|ex[- ]?demo|pre[- ]?owned|b[- ]grade|second[- ]hand/i;
const SIZE = /\d{2}(?:\.\d)?(?:"|''|-inch| ?inch)/i; // Costco writes "65 Inch"

const CATS: Record<Exclude<CategoryId, "phones" | "graphics-cards">, { paths: string[]; keep: (t: string) => boolean }> = {
  tvs: {
    paths: ["/Electronics/TVs-Projectors/TVs/c/cos_21.1.2"],
    keep: (t) => /tv\b|television/i.test(t) && SIZE.test(t) && !/bezel|soundbar|projector|mount|bracket|\bstand\b|remote|antenna|cable/i.test(t),
  },
  monitors: {
    // Costco files monitors with projectors.
    paths: ["/Computers/Monitors/c/cos_22.3", "/Electronics/TVs-Projectors/Monitors-Projectors/c/cos_21.2"],
    keep: (t) =>
      /monitor|display/i.test(t) && SIZE.test(t) && !/projector|monitor arms?\b|\barm\b|riser|bracket|cable/i.test(t),
  },
  laptops: {
    paths: ["/Computers/Laptops/c/cos_22.1", "/Computers/Gaming/Gaming-Laptops/c/cos_22.15.4"],
    keep: (t) => !/\bbag\b|sleeve|\bcase\b|backpack|charger|\bdock\b|\bstand\b|mouse|imac|desktop|all-in-one|mac mini|cover/i.test(t),
  },
  tablets: {
    paths: ["/Computers/iPads-Tablets/iPads/c/cos_22.7.2", "/Computers/iPads-Tablets/Tablets/c/cos_22.7.1"],
    keep: (t) =>
      /\d+\s?(gb|tb)/i.test(t) &&
      !/^(?!.*tablet).*\bcase\b|cover\b|folio|keyboard|pencil|stylus|protector|kindle|kobo|ereader|charger|sleeve|\bstand\b/i.test(t),
  },
};

const num = (s?: string) => (s ? Number(s.replace(/,/g, "")) : 0);

/** Costco titles usually end with the model code, e.g. "... 4K Smart TV 65QNED86BSA". */
function mpnOf(title: string): string | undefined {
  const last = title.trim().split(/\s+/).pop() ?? "";
  const mid = title.match(/\b[A-Z0-9]{3,}-[A-Z0-9]{3,}(?:AU)?\b/)?.[0];
  if (mid && /\d/.test(mid) && /[A-Z]/.test(mid) && !/^(SM|USB)-?$/.test(mid)) return mid;
  return last.length >= 5 && /\d/.test(last) && /[A-Z]/.test(last) && !/^\d+(gb|tb|hz)$/i.test(last) && last === last.toUpperCase()
    ? last
    : undefined;
}

async function scrapeCategory(cat: keyof typeof CATS): Promise<RawOffer[]> {
  const { paths, keep } = CATS[cat];
  const out = new Map<string, RawOffer>();
  for (const p of paths) {
    for (let page = 0; page < 15; page++) {
      const html = await get(`${BASE}${p}?currentPage=${page}`);
      let fresh = 0;
      for (const tile of html.split(/(?=<a[^>]*class="thumb"[^>]*href="[^"]*\/p\/\d+")/).slice(1)) {
        const t = tile.slice(0, 12000);
        const url = t.match(/href="([^"]+\/p\/\d+)"/)?.[1];
        const id = url?.split("/p/")[1];
        if (!url || !id || out.has(id)) continue;
        fresh++;
        const title = decodeEntities(t.match(/title="([^"]+)"/)?.[1] ?? "").trim();
        const panel = t.slice(t.indexOf("price-panel"), t.indexOf("product-list-details"));
        const prices = [...panel.matchAll(/\$\s*([\d,]+\.\d\d)/g)].map((m) => num(m[1]));
        if (!title || !prices.length) continue;
        if (JUNK.test(title) || !keep(title)) {
          if (process.env.DEBUG_DROPS) console.error(`drop ${cat}: ${title}`);
          continue;
        }
        const price = Math.min(...prices);
        const was = Math.max(...prices);
        const img = t.match(/<img[^>]*src="([^"]+)"/)?.[1];
        out.set(id, {
          retailer: "costco",
          sku: id,
          title,
          url: BASE + url,
          price,
          wasPrice: was > price ? was : undefined,
          image: img ? (img.startsWith("http") ? img : BASE + img) : undefined,
          inStock: !/out of stock|sold out/i.test(t),
          mpn: mpnOf(title),
          brand: title.split(/\s+/)[0],
        });
      }
      if (!fresh) break;
      await sleep(800);
    }
    await sleep(800);
  }
  return [...out.values()];
}

// Costco AU does not sell graphics cards.
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  tvs: () => scrapeCategory("tvs"),
  monitors: () => scrapeCategory("monitors"),
  laptops: () => scrapeCategory("laptops"),
  tablets: () => scrapeCategory("tablets"),
};
