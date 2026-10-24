/**
 * Sonos UK (sonos.com/en-gb): speakers, soundbars and Sonos Ace headphones.
 * The shop page server-renders `window.pageContext = {"plpProducts":[{productId,price,variants}]}` (ids only);
 * each product page carries a JSON-LD ProductGroup whose hasVariant[] gives name ("Beam Ultra - Black"),
 * sku (Sonos part code, e.g. BMULTAU1BLK), colour, price and availability. Sets, pairs and accessories are skipped.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../../src/lib/types";
import { decodeEntities, get, pool, sleep } from "../../../lib/http";

const BASE = "https://www.sonos.com/en-gb/shop";

function classify(id: string): "speakers" | "soundbars" | "headphones" | undefined {
  if (/set|pair|mount|stand|cable|adapter|battery|charg|cushion|case|grille|bag|hook|shelf|plug|pads|gift|power|boost|wireless-charger/.test(id)) return undefined;
  if (/^(beam|arc|ray)(-ultra)?$/.test(id)) return "soundbars";
  if (/^sonos-ace(-ultra)?$/.test(id)) return "headphones";
  if (/^(era-\d+(-sl)?|move(-2)?|roam(-2)?|sonos-play|five|one(-sl)?)$/.test(id)) return "speakers";
  return undefined; // Sub, Amp, Port and architectural speakers are components, not in these categories
}

let cache: Promise<{ cat: string; offer: RawOffer }[]> | undefined;
function all() {
  cache ??= (async () => {
    const html = await get(BASE);
    const i = html.indexOf("window.pageContext=");
    if (i < 0) throw new Error("no pageContext");
    const ids = [...new Set([...html.slice(i, i + 200_000).matchAll(/\{"productId":"([a-z0-9-]+)","price":/g)].map((m) => m[1]))];
    const wanted = ids.map((id) => ({ id, cat: classify(id) })).filter((x) => x.cat);
    const res = await pool(wanted, 2, async ({ id, cat }) => {
      const out: { cat: string; offer: RawOffer }[] = [];
      try {
        const page = await get(`${BASE}/${id}`);
        await sleep(700);
        for (const [, body] of page.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
          let d: Record<string, unknown>;
          try {
            d = JSON.parse(body);
          } catch {
            continue;
          }
          const variants = (d["@type"] === "ProductGroup" ? d.hasVariant : d["@type"] === "Product" ? [d] : []) as Record<string, unknown>[];
          for (const v of variants) {
            const o = (Array.isArray(v.offers) ? v.offers[0] : v.offers) as Record<string, unknown> | undefined;
            const price = Number(o?.price);
            if (!price || !v.sku) continue;
            const name = decodeEntities(String(v.name)).replace(/\s+/g, " ").trim();
            out.push({
              cat: cat!,
              offer: {
                retailer: "uk-sonos" as RetailerId,
                sku: String(v.sku),
                mpn: String(v.sku),
                brand: "Sonos",
                title: /^sonos/i.test(name) ? name : `Sonos ${name}`,
                url: String(o?.url ?? `${BASE}/${id}`),
                price,
                image: typeof v.image === "string" ? v.image : undefined,
                inStock: /InStock/i.test(String(o?.availability ?? "")),
              },
            });
          }
        }
      } catch {}
      return out;
    });
    return res.flat();
  })();
  return cache;
}

const pick = (cat: string) => async () => {
  const seen = new Set<string>();
  return (await all()).filter((x) => x.cat === cat && !seen.has(x.offer.sku) && seen.add(x.offer.sku)).map((x) => x.offer);
};

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  speakers: pick("speakers"),
  soundbars: pick("soundbars"),
  headphones: pick("headphones"),
};
