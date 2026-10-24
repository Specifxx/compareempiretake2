/**
 * Laptops Direct (laptopsdirect.co.uk): laptops, PCs, monitors, PC parts, storage, phones, tablets, TVs, watches,
 * drones, printers, routers, soundbars and headphones. Listing pages (/ct/<path>?pageNumber=N) server-render
 * one card per product with data-cnstrc-item-id / -name / -price (today's price, GBP incl. VAT), "SKU: <code>"
 * (the manufacturer part number, also passed to EnEcomProdClick), a strikethrough "was" price and the product link.
 * The listing shows no stock state, so a listed product counts as in stock unless its card says otherwise.
 * Refurbished / ex-display listings (title or URL) are dropped; the "Refurbished from £…" side link is ignored.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { IS, badPrice, junk } from "../../categories/jbhifi";
import { looksLikePhone } from "../../filter";

const BASE = "https://www.laptopsdirect.co.uk";
const money = (s: string | undefined) => Number((s ?? "").replace(/&#163;|£|,/g, "").trim()) || undefined;

type Card = { id: string; name: string; price?: number; was?: number; url?: string; mpn?: string; image?: string; out: boolean };

function cards(html: string): Card[] {
  return html.split("data-cnstrc-item-id=").slice(1).map((c) => {
    const body = c.slice(0, 20_000);
    const href = body.match(/class="productHref_\d+" href="([^"]+)"/)?.[1];
    const img = body.match(/class="offerImage"[^>]*?src="([^"]+)"/)?.[1] ?? body.match(/<img[^>]+id="productImage_\d+"[^>]*src="([^"]+)"/)?.[1];
    return {
      id: c.match(/^"(\d+)"/)?.[1] ?? "",
      name: decodeEntities(c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1] ?? ""),
      price: money(c.match(/data-cnstrc-item-price="([^"]*)"/)?.[1]),
      was: money(body.match(/class="strikethrough">\s*([^<]+)</)?.[1]),
      url: href ? new URL(href, BASE).href : undefined,
      mpn: body.match(/EnEcomProdClick\('([^']+)'/)?.[1] ?? body.match(/SKU:\s*([A-Z0-9][A-Z0-9#\/.-]+)/i)?.[1],
      image: img ? new URL(img, BASE).href : undefined,
      out: /out of stock|notify me when/i.test(body.replace(/<[^>]+>/g, " ")),
    };
  });
}

const pages = new Map<string, Promise<Card[]>>();
function crawl(path: string): Promise<Card[]> {
  let p = pages.get(path);
  if (!p) {
    p = (async () => {
      const out: Card[] = [];
      const seen = new Set<string>();
      for (let n = 1; n <= 40; n++) {
        let html: string;
        try {
          html = await get(`${BASE}/ct/${path}${n > 1 ? `?pageNumber=${n}` : ""}`, n > 1 ? 2 : 4);
        } catch (e) {
          if (n === 1) throw e;
          break;
        }
        const cs = cards(html).filter((c) => c.id && !seen.has(c.id));
        if (!cs.length) break;
        for (const c of cs) seen.add(c.id);
        out.push(...cs);
        if (!html.includes(`pageNumber=${n + 1}`)) break;
        await sleep(1000);
      }
      return out;
    })();
    pages.set(path, p);
  }
  return p;
}

async function scrape(cat: CategoryId, paths: string[]): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of paths) {
    for (const c of await crawl(path)) {
      const title = c.name.replace(/\s+/g, " ").trim();
      if (!title || !c.url || !c.price || out.has(c.id)) continue;
      if (/refurb|renewed|ex[- ]?display|open box|pre-?owned|grade [abc]\b/i.test(`${title} ${c.url}`)) continue;
      if (cat === "phones" ? !looksLikePhone(title) : junk(cat, title) || !IS[cat](title) || badPrice(cat, c.price)) continue;
      out.set(c.id, {
        retailer: "uk-laptopsdirect",
        sku: c.id,
        mpn: c.mpn,
        title,
        url: c.url,
        price: c.price,
        wasPrice: c.was && c.was > c.price ? c.was : undefined,
        image: c.image,
        inStock: !c.out,
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  laptops: () => scrape("laptops", ["laptops-and-netbooks/laptops"]),
  desktops: () => scrape("desktops", ["pcs/desktop-pcs", "pcs/all-in-one-pcs", "pcs/mini-pcs"]),
  monitors: () => scrape("monitors", ["monitors-and-projectors/monitors"]),
  "graphics-cards": () => scrape("graphics-cards", ["components/graphics-cards"]),
  cpus: () => scrape("cpus", ["components/processors"]),
  motherboards: () => scrape("motherboards", ["components/motherboards"]),
  ram: () => scrape("ram", ["components/desktop-pc-memory", "components/laptop-memory"]),
  ssds: () => scrape("ssds", ["storage/ssd", "storage/external-ssd"]),
  phones: () => scrape("phones", ["phones/smartphones"]),
  tablets: () => scrape("tablets", ["tablet-pcs-and-e-readers/tablets"]),
  tvs: () => scrape("tvs", ["tv-and-home-entertainment/tvs"]),
  smartwatches: () => scrape("smartwatches", ["wearables/smart-watches"]),
  drones: () => scrape("drones", ["uavs/drones"]),
  printers: () => scrape("printers", ["printers-and-scanners/printers"]),
  routers: () => scrape("routers", ["networking/routers", "networking/wireless-mesh"]),
  soundbars: () => scrape("soundbars", ["hi-fi-and-home-cinema/soundbar-speakers"]),
  headphones: () => scrape("headphones", ["mobile-device-accessories/headphones"]),
};
