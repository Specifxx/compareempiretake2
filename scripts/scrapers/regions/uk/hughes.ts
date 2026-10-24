/**
 * Hughes (hughes.co.uk, Shopware): TVs, soundbars, headphones and speakers.
 * Listing pages (?p=N) server-render one "card product-box" per product: name ("Samsung R85H 55\" … - MRE55R85H",
 * the model code after the last " - "), link, image, today's price (GBP incl. VAT), "Save £X" (→ was = price + X)
 * and the stock line ("In stock" / "Out of stock"). Ex-display and graded items are dropped.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { IS, badPrice, junk, mpnFromCode } from "../../categories/jbhifi";

const BASE = "https://www.hughes.co.uk";
const money = (s: string | undefined) => Number(decodeEntities(s ?? "").replace(/[£,\s]/g, "")) || undefined;

type Card = { name: string; url: string; price?: number; save?: number; image?: string; inStock: boolean };

function cards(html: string): Card[] {
  return html
    .split('class="card product-box')
    .slice(1)
    .map((c) => {
      const t = c.replace(/<script[\s\S]*?<\/script>/g, "");
      const a = t.match(/<a href="([^"]+)"\s+class="product-name[^"]*"[^>]*>([\s\S]*?)<\/a>/);
      return {
        name: decodeEntities((a?.[2] ?? "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(),
        url: a?.[1] ?? "",
        price: money(t.match(/class="product-price(?: [^"]*)?">\s*([^<]+)/)?.[1]),
        save: money(t.match(/list-price-percentage">\s*Save\s*([^<]+)/)?.[1]),
        image: t.match(/<img src="(https:\/\/[^"]+)"/)?.[1],
        inStock: /In stock/i.test(t) && !/Out of stock|Sold out/i.test(t),
      };
    });
}

const lists = new Map<string, Promise<Card[]>>();
function crawl(path: string): Promise<Card[]> {
  let l = lists.get(path);
  if (!l) {
    l = (async () => {
      const out: Card[] = [];
      const seen = new Set<string>();
      for (let p = 1; p <= 30; p++) {
        const html = await get(`${BASE}/${path}${p > 1 ? `?p=${p}` : ""}`, p > 1 ? 2 : 4);
        const cs = cards(html).filter((c) => c.url && !seen.has(c.url));
        if (!cs.length) break;
        for (const c of cs) seen.add(c.url);
        out.push(...cs);
        if (!html.includes(`p=${p + 1}`)) break;
        await sleep(1000);
      }
      return out;
    })();
    lists.set(path, l);
  }
  return l;
}

async function scrape(cat: Exclude<CategoryId, "phones">, paths: string[]): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of paths) {
    for (const c of await crawl(path)) {
      if (!c.name || !c.price || out.has(c.url)) continue;
      if (/ex[- ]?display|graded|refurb|open box|b[- ]grade/i.test(c.name) || junk(cat, c.name) || !IS[cat](c.name) || badPrice(cat, c.price)) continue;
      const mpn = mpnFromCode(c.name);
      out.set(c.url, {
        retailer: "uk-hughes",
        sku: c.url.split("/").pop() ?? c.url,
        mpn,
        brand: c.url.split("/").slice(-2, -1)[0]?.replace(/-/g, " ").replace(/\b[a-z]/g, (x) => x.toUpperCase()) || undefined,
        title: c.name,
        url: c.url,
        price: c.price,
        wasPrice: c.save ? Math.round((c.price + c.save) * 100) / 100 : undefined,
        image: c.image,
        inStock: c.inStock,
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  tvs: () => scrape("tvs", ["tv-and-entertainment/televisions/all-televisions/"]),
  soundbars: () => scrape("soundbars", ["tv-and-entertainment/dvd-blu-ray-and-homecinema/soundbar/", "tv-and-entertainment/dvd-blu-ray-and-homecinema/dolby-atmos-soundbar/"]),
  headphones: () => scrape("headphones", ["audio/headphones/all-headphones/"]),
  speakers: () => scrape("speakers", ["audio/portable-audio/bluetooth-speakers/", "audio/hifi-and-speakers/smart-speakers/"]),
};
