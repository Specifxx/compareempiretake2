/**
 * Abt Electronics (abt.com, Glenview IL) — server-rendered category pages (?start_index=N&per_page=100).
 * Each card is `<li data-productId="…">` with the title link ("LG UHD NU85 4K 75-Inch Smart TV - 75NU850BPUA",
 * the part after the last " - " is the full model code = mpn) and image; the page's GA object `pbGaObjArr`
 * gives each id's price (USD) and brand. A card with an "ADD TO CART" button is in stock.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { NOT_NEW } from "./_shopify";

const BASE = "https://www.abt.com";
type Ga = { item_id: string; item_name: string; item_brand?: string; price?: number; abt_model?: string };

async function crawl(path: string, keep: (t: string) => boolean, maxPages = 6): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let page = 0; page < maxPages; page++) {
    const html = await get(`${BASE}${path}?start_index=${page * 100}&per_page=100`);
    const ga = new Map<string, Ga>();
    for (const m of html.matchAll(/pbGaObjArr\s*=\s*(\{.*?\})\s*<\/script>/gs)) {
      try {
        for (const [id, g] of Object.entries(JSON.parse(m[1]) as Record<string, Ga>)) ga.set(id, g);
      } catch {
        /* skip malformed block */
      }
    }
    const blocks = html.split(/<li data-productId="/).slice(1);
    let n = 0;
    for (const b of blocks) {
      const id = b.match(/^(\d+)"/)?.[1];
      if (!id) continue;
      n++;
      const link = b.match(/<a href="(https:\/\/www\.abt\.com\/[^"]+\/p\/\d+\.html)" class="categoryTitleLink[^>]*>\s*([^<]+?)\s*<\/a>/);
      const g = ga.get(id);
      if (!link || !g?.price) continue;
      const full = decodeEntities(link[2]).replace(/\s+/g, " ").trim();
      if (NOT_NEW.test(full) || !keep(full)) continue;
      const dash = full.lastIndexOf(" - ");
      const mpn = dash > 0 ? full.slice(dash + 3).trim() : g.abt_model;
      const img = b.match(/<img[^>]+src="(https:\/\/content\.abt\.com\/[^"]+)"/)?.[1];
      out.set(id, {
        retailer: "us-abt",
        sku: id,
        title: full,
        url: link[1],
        price: g.price,
        image: img ? decodeEntities(img) : undefined,
        inStock: /class="addToCart/.test(b),
        brand: g.item_brand,
        mpn,
      });
    }
    if (n < 100) break;
    await sleep(800);
  }
  return [...out.values()];
}

const ACC = /\b(case|cover|stand|mount|bracket|cable|adapter|charger|strap|band|screen protector|sleeve|bag|dock|keyboard|mouse|stylus|pen|filter|brush|bundle|package|kit)\b/i;
const ok = (t: string) => !ACC.test(t);

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  tvs: () => crawl("/Flat-Screen-TVs/c/402.html", ok),
  laptops: () => crawl("/Laptops-Notebook-Computers/c/415.html", ok),
  desktops: () => crawl("/Desktop-Computers/c/444.html", (t) => ok(t) && !/monitor(?!.*all-in-one)/i.test(t)),
  tablets: () => crawl("/Tablets/c/2016.html", (t) => !/\b(case|cover|keyboard|pencil|stylus|protector|folio)\b/i.test(t)),
  monitors: () => crawl("/Computer-Monitors/c/442.html", ok),
  printers: () => crawl("/Printers-Scanners/c/517.html", (t) => ok(t) && !/\b(ink|toner|paper|cartridge)\b/i.test(t)),
  routers: () => crawl("/Wireless-Routers/c/2393.html", ok),
  soundbars: () => crawl("/Soundbars/c/1122.html", (t) => ok(t) && !/mount|bracket/i.test(t)),
  headphones: () => crawl("/All-Headphones/c/2804.html", (t) => ok(t) && !/amplifier|\bdac\b|ear ?tips|cushion|pads/i.test(t)),
  speakers: () => crawl("/Bluetooth-Portable-Speakers/c/358.html", ok),
  smartwatches: () => crawl("/Smartwatches/c/2211.html", ok),
  cameras: () => crawl("/Digital-Cameras/c/20.html", (t) => ok(t) && !/\blens\b(?!.*kit)/i.test(t)),
  drones: () => crawl("/Drones/c/2359.html", (t) => !/\b(battery|propeller|case|bag|charger|controller|filter)\b/i.test(t)),
  consoles: () => crawl("/Gaming-Consoles/c/945.html", (t) => ok(t) && !/controller|headset|disc drive|faceplate|console cover/i.test(t)),
  "robot-vacuums": () => crawl("/Robotic-Vacuums/c/2049.html", (t) => !/\b(filter|brush|bag|mop pad|accessor|replacement)\b/i.test(t)),
  phones: () => crawl("/Unlocked-Cell-Phones/c/2475.html", (t) => !/\b(case|cover|charger|protector)\b/i.test(t)),
};
