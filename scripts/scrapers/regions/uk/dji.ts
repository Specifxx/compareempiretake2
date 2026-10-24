/**
 * DJI Store UK (store.dji.com/uk): drones and action/360/pocket cameras.
 * The home page (?set_region=GB) server-renders `window.__PRELOADED_STATE__`, whose product cards carry
 * title, slug, price/originalPrice (AUD) and status. DJI shows no part number on the store, so mpn stays empty;
 * the bundle ("Fly More Combo (DJI RC 2)", "Standard Combo") is part of the title and identifies the SKU.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../../src/lib/types";
import { get } from "../../../lib/http";

const BASE = "https://store.dji.com/uk";

type Card = {
  title?: string;
  slug?: string;
  price?: number;
  originalPrice?: number;
  status?: { code?: string };
  image?: string;
  cover?: string;
};

function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}

let cache: Promise<Card[]> | undefined;
function cards(): Promise<Card[]> {
  cache ??= (async () => {
    const html = await get(`${BASE}?set_region=GB`);
    const i = html.indexOf("window.__PRELOADED_STATE__");
    if (i < 0) throw new Error("no __PRELOADED_STATE__");
    const src = html.slice(html.indexOf("=", i) + 1).trimStart();
    // The state is a JSON object literal followed by ";" — find its end by brace matching (strings respected).
    let depth = 0, inStr = false, end = 0;
    for (let j = 0; j < src.length; j++) {
      const c = src[j];
      if (inStr) {
        if (c === "\\") j++;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        end = j + 1;
        break;
      }
    }
    const state = JSON.parse(src.slice(0, end));
    const bySlug = new Map<string, Card>();
    for (const n of walk(state)) {
      if (typeof n.priceCents !== "number" || typeof n.slug !== "string" || typeof n.title !== "string") continue;
      if (!bySlug.has(n.slug)) bySlug.set(n.slug, n as Card);
    }
    return [...bySlug.values()];
  })();
  return cache;
}

const JUNK = /care refresh|protection plan|warranty|^(dji )?(intelligent flight )?battery|charging hub|propeller|controller only|^(dji )?rc\b|filter|lens|case|bag|mount|adapter|cable|goggles(?! .*combo)|remote|\bmic\b|power \d|power station|gimbal|\bRS \d|ronin|transmission|focus|air unit|osmo mobile|microsd|card|refurb/i;

function classify(t: string): CategoryId | undefined {
  if (/romo/i.test(t)) return "robot-vacuums";
  if (/osmo (action|360|pocket|nano)|dji (action|pocket)/i.test(t)) return "cameras";
  if (/\b(mini|air|mavic|avata|flip|neo|lito|inspire)\b/i.test(t) && !/osmo/i.test(t)) return "drones";
  return undefined;
}

async function scrape(cat: CategoryId): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const c of await cards()) {
    const title = (c.title ?? "").replace(/[ ​-‍]/g, " ").replace(/\s+/g, " ").trim();
    if (!c.price || !title || classify(title) !== cat) continue;
    if (cat !== "robot-vacuums" && JUNK.test(title)) continue;
    if (cat === "robot-vacuums" && /protection|plan|filter|brush|mop|bag/i.test(title)) continue;
    let img = c.image ?? (typeof c.cover === "string" ? c.cover : undefined);
    if (img?.startsWith("//")) img = `https:${img}`;
    out.push({
      retailer: "uk-dji" as RetailerId,
      sku: c.slug!,
      brand: "DJI",
      title: /^dji\b/i.test(title) ? title : `DJI ${title}`,
      url: `${BASE}/product/${c.slug}`,
      price: c.price,
      wasPrice: c.originalPrice && c.originalPrice > c.price ? c.originalPrice : undefined,
      image: img,
      inStock: c.status?.code !== "out_of_stock",
    });
  }
  return out;
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  drones: () => scrape("drones"),
  cameras: () => scrape("cameras"),
  // DJI ROMO (robot vacuum) is a single listing — below the runner's 3-offer floor, so not scraped.
};
