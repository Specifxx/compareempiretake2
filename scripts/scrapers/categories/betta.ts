import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { get, pool, sleep } from "../../lib/http";
import { mpnFromBody, mpnFromTitle, shopifyCategory } from "./jbhifi";

const BASE = "https://www.betta.com.au";
type Cat = Exclude<CategoryId, "phones">;
/** Betta SKUs are internal six-digit numbers. */
const body = { mpn: (p: { body_html: string }) => mpnFromBody(p.body_html) };

/**
 * Betta's product pages carry the manufacturer model in an inline script
 * (`model_number = "S70TY";`), which the JSON feed lacks. One page per offer, politely.
 */
async function withModel(offers: Promise<RawOffer[]>): Promise<RawOffer[]> {
  const list = await offers;
  const byUrl = new Map<string, string | undefined>();
  await pool([...new Set(list.map((o) => o.url.split("?")[0]))], 3, async (url) => {
    try {
      const html = await get(url);
      const m = html.match(/model_number\s*=\s*"([^"]{3,40})"/)?.[1]?.trim();
      byUrl.set(url, m && /\d/.test(m) && /[a-z]/i.test(m) && !/\s{2}/.test(m) ? m.toUpperCase() : undefined);
    } catch {
      /* keep the offer without a model code */
    }
    await sleep(200);
  });
  return list.map((o) => ({ ...o, mpn: byUrl.get(o.url.split("?")[0]) ?? o.mpn }));
}

const b = (cat: Cat, collections: string[]) => () => withModel(shopifyCategory("betta", BASE, cat, collections, body));

export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = {
  tvs: b("tvs", ["tvs"]),
  laptops: b("laptops", ["laptop-computers"]),
  tablets: b("tablets", ["tablet-computers", "ipad"]),
  monitors: () =>
    withModel(shopifyCategory("betta", BASE, "monitors", ["monitors"], { mpn: (p) => mpnFromBody(p.body_html) ?? mpnFromTitle(p.title) })),

  smartwatches: b("smartwatches", ["apple-watches"]),
  printers: b("printers", ["printers-faxes-scanners"]),
  routers: b("routers", ["routers-modems"]),
  soundbars: b("soundbars", ["sound-bars"]),
  headphones: b("headphones", ["headphones", "in-ear-headphones", "on-ear-headphones", "over-ear-headphones", "apple-headphones"]),
  speakers: b("speakers", ["bluetooth-speakers", "speakers", "smart-speaker"]),
  cameras: b("cameras", ["cameras", "digital-cameras", "drones"]),
  drones: b("drones", ["drones"]),
  "robot-vacuums": b("robot-vacuums", ["robotic-vacuums", "irobot"]),
};
