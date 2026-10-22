import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

const BASE = "https://www.thegoodguys.com.au";

const JUNK = /refurb|renewed|open[- ]?box|ex[- ]?demo|pre[- ]?owned|b[- ]grade|second[- ]hand/i;
const SIZE = /\d{2}(?:\.\d)?(?:"|''|-inch| ?inch)/i;

const CATS: Record<Exclude<CategoryId, "phones" | "graphics-cards">, { paths: string[]; keep: (t: string) => boolean }> = {
  tvs: {
    paths: ["/televisions"],
    keep: (t) => /\btv\b|television/i.test(t) && SIZE.test(t) && !/soundbar|projector|mount|bracket|\bstand\b|remote|antenna|cable/i.test(t),
  },
  monitors: {
    paths: ["/computers-tablets-and-gaming/monitors"],
    keep: (t) =>
      /monitor|display/i.test(t) &&
      (SIZE.test(t) || /^\S+ \d{2}(?:\.\d)? /.test(t)) &&
      !/monitor arms?\b|\barm\b|riser|workstation|mouse pad|bracket|cable|privacy filter|(monitor|display) stands?\b|standing|\blift\b|\d"? - \d|\bmount\b(?! adapter)|\bclamp\b|\d+inch - \d+inch/i.test(t),
  },
  laptops: {
    paths: [
      "/computers-tablets-and-gaming/desktop-and-laptop/laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/macbook",
      "/computers-tablets-and-gaming/desktop-and-laptop/gaming-laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/2in1-laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/chromebook",
      "/computers-tablets-and-gaming/desktop-and-laptop/microsoft-surface",
    ],
    keep: (t) => !/\bbag\b|sleeve|\bcase\b|backpack|charger|\bdock\b|docking station|\bstand\b|mouse|keyboard$|imac|desktop|all-in-one|mac mini|cover|skin\b|protector/i.test(t),
  },
  tablets: {
    paths: ["/computers-tablets-and-gaming/ipad-and-tablets/ipad", "/computers-tablets-and-gaming/ipad-and-tablets/tablets"],
    keep: (t) =>
      /\d+\s?(gb|tb)/i.test(t) &&
      !/^(?!.*tablet).*\bcase\b|cover\b|folio|keyboard|pencil|stylus|protector|kindle|kobo|ereader|charger|sleeve|\bstand\b/i.test(t),
  },
};

async function scrapeCategory(cat: keyof typeof CATS): Promise<RawOffer[]> {
  const { paths, keep } = CATS[cat];
  const offers = new Map<string, RawOffer>();
  for (const p of paths) {
    for (let page = 1; page <= 40; page++) {
      let html: string;
      try {
        html = await get(`${BASE}${p}?page=${page}`);
      } catch (e) {
        if (page > 1 && (e as { permanent?: boolean }).permanent) break;
        throw e;
      }
      const cards = html.split('data-testid="product-card"').slice(1);
      let fresh = 0;
      for (const c of cards) {
        const name = c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1];
        const price = Number(c.match(/data-cnstrc-item-price="([\d.]+)"/)?.[1]);
        const href = c.match(/href="(\/[^"#?]+)"/)?.[1];
        if (!name || !price || !href) continue;
        if (offers.has(href)) continue;
        fresh++;
        const title = decodeEntities(name).replace(/&#x27;/g, "'").trim();
        if (JUNK.test(title) || !keep(title)) {
          if (process.env.DEBUG_DROPS) console.error(`drop ${cat}: ${title}`);
          continue;
        }
        const body = c.slice(0, 20000);
        const img = body.match(/<img[^>]*src="([^"]+)"/)?.[1];
        const was = Number(body.match(/(?:was|Was|RRP)[^$]{0,80}\$\s?([\d,]+(?:\.\d\d)?)/)?.[1]?.replace(/,/g, ""));
        // The URL slug ends with the model code, e.g. "...-smart-ai-tv-2026-75u85au".
        const code = href.split("-").pop()!.toUpperCase();
        const mpn = /\d/.test(code) && /[A-Z]/.test(code) && code.length >= 5 ? code : undefined;
        offers.set(href, {
          retailer: "thegoodguys",
          sku: href.slice(1),
          title,
          url: BASE + href,
          price,
          wasPrice: was > price ? was : undefined,
          image: img ? decodeEntities(img) : undefined,
          inStock: !/sold out|out of stock|unavailable/i.test(body.slice(0, 6000)),
          mpn,
          brand: title.split(/\s+/)[0],
        });
      }
      const total = Number(html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1] ?? 0);
      if (cards.length === 0 || fresh === 0 || (total && page * 29 >= total)) break;
      await sleep(800);
    }
    await sleep(800);
  }
  return [...offers.values()];
}

// The Good Guys does not sell graphics cards.
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  tvs: () => scrapeCategory("tvs"),
  monitors: () => scrapeCategory("monitors"),
  laptops: () => scrapeCategory("laptops"),
  tablets: () => scrapeCategory("tablets"),
};
