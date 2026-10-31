/**
 * Daily eBay prices through the Browse API, spending the day's call budget on the products most
 * likely to get eBay clicks.
 *
 *   EBAY_CLIENT_ID / EBAY_CLIENT_SECRET   the production App ID and Cert ID (GitHub secrets only)
 *   EBAY_DAILY_CALLS                      Browse calls to spend (default 4950 of eBay's 5,000/day;
 *                                         the OAuth token call is a different API and doesn't count)
 *
 * Plan (see DECISIONS.md, "eBay prices: spend 5,000 calls on the products people click"):
 * 1. Candidates: every product in every live region whose best price is at least 10 in its currency.
 * 2. Score = demand × staleness. Demand: stores stocking it (the best popularity signal we have),
 *    newer models, a category weight (phones, consoles, GPUs, headphones… are where eBay is cheapest
 *    and most clicked), price (commission is a share of the sale) and a boost for the US, the market
 *    we're growing. Staleness: never checked first, then the longest since its last check.
 * 3. The top ~25% by demand are refreshed every day; the rest of the budget rotates through the tail,
 *    so every product over the floor gets a fresh price within a few days.
 *
 * One search per product, in its own marketplace (EBAY_AU, EBAY_US, EBAY_GB): new, Buy It Now,
 * located in that country, priced within a band around our best store price, so accessories and
 * parts don't match. A listing must also contain the product's identifying words. The cheapest
 * listing that passes, with its affiliate URL, is written to data/<region>/ebay.json.
 * Pages never call eBay; they read that file at build.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { dataPath, REGION_IDS, type RegionId } from "../src/lib/region";
import { EBAY_CAMPAIGN_ID } from "../src/lib/ebay";
import type { Catalog, CategoryId, Phone } from "../src/lib/types";
import { pool, sleep } from "./lib/http";

const ID = process.env.EBAY_CLIENT_ID;
const SECRET = process.env.EBAY_CLIENT_SECRET;
const BUDGET = Number(process.env.EBAY_DAILY_CALLS || 4950);
const MIN_PRICE = 10;
// `zip`: a central postcode, sent as the buyer's location so eBay quotes real postage there (visitor feedback on
// WargameCompare, 2026-10-31: postage the row did not show made eBay rows "a lot of wasted clicks").
const MARKET: Record<RegionId, { id: string; currency: string; country: string; zip: string }> = {
  au: { id: "EBAY_AU", currency: "AUD", country: "AU", zip: "2000" },
  us: { id: "EBAY_US", currency: "USD", country: "US", zip: "64101" },
  uk: { id: "EBAY_GB", currency: "GBP", country: "GB", zip: "B1 1AA" },
};
/** How much eBay demand each category tends to have (1 = typical). */
const CATEGORY_WEIGHT: Partial<Record<CategoryId, number>> = {
  phones: 1.6, consoles: 1.6, "graphics-cards": 1.5, headphones: 1.4, tablets: 1.3, smartwatches: 1.3, cameras: 1.3,
  drones: 1.3, laptops: 1.2, cpus: 1.2, ssds: 1.1, ram: 1.1, tvs: 1.0, monitors: 1.0, speakers: 1.0, soundbars: 0.9,
  "robot-vacuums": 0.9, motherboards: 0.9, routers: 0.8, desktops: 0.7, printers: 0.6,
  // Appliances: eBay sells small ones new; big whitegoods are mostly pick-up or second-hand there.
  vacuums: 1.0, "coffee-machines": 1.0, "air-fryers": 0.8, fridges: 0.3, "washing-machines": 0.3, dishwashers: 0.3,
};
const REGION_WEIGHT: Record<RegionId, number> = { au: 1.0, us: 1.25, uk: 0.9 };
/** Words that mark a listing as something other than the product itself. */
const NOT_THE_PRODUCT = /\b(case|cover|protector|skin|sticker|decal|stand|mount|holder|strap|band|charger|cable|adapter|dock|box only|empty box|parts|repair|broken|faulty|for parts|replacement|housing|shell|lcd|screen only|motherboard only|keyboard only|remote only|manual|bundle of|lot of|refurbished|renewed|used|open box|pre-owned)\b/i;

export interface EbayListing {
  price: number;
  shipping?: number;
  title: string;
  url: string;
  image?: string;
  seller?: string;
  feedback?: number;
  checkedAt: string;
}
type EbayFile = { updatedAt: string; listings: Record<string, EbayListing>; checked: Record<string, string> };

interface Candidate { region: RegionId; key: string; p: Phone; demand: number; last?: string }

function loadCatalog(region: RegionId): Phone[] {
  return CATEGORIES.flatMap((c) => {
    const f = `${dataPath(region, c.id)}/catalog.json`;
    if (!existsSync(f)) return [];
    const cat = JSON.parse(readFileSync(f, "utf8")) as Catalog;
    return cat.phones.map((p) => ({ ...p, category: c.id as CategoryId }));
  });
}

const fileOf = (region: RegionId) => `${dataPath(region)}/ebay.json`;
function loadFile(region: RegionId): EbayFile {
  const f = fileOf(region);
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as EbayFile) : { updatedAt: "", listings: {}, checked: {} };
}

function demand(p: Phone, region: RegionId): number {
  const stores = Math.log2(1 + p.retailerCount);
  const recency = 1 + Math.min(p.generation, 30) / 60;
  const price = Math.log10(Math.max(p.bestPrice, MIN_PRICE));
  return stores * recency * price * (CATEGORY_WEIGHT[p.category] ?? 1) * REGION_WEIGHT[region];
}

/** The words a listing title must contain: brand plus the model's distinctive tokens. */
function mustHave(p: Phone): string[] {
  const words = `${p.brand} ${p.model}`
    .toLowerCase()
    .replace(/[^a-z0-9.+ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(the|and|with|for|in|of|inch|gb|tb|wi|fi|smart|new|edition)$/.test(w));
  return [...new Set(words)].slice(0, 6);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.+ ]/g, " ");

async function token(): Promise<string> {
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${Buffer.from(`${ID}:${SECRET}`).toString("base64")}` },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!res.ok) throw new Error(`eBay token: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type Summary = {
  title: string;
  price?: { value: string; currency: string };
  shippingOptions?: { shippingCost?: { value: string; currency?: string } }[];
  itemAffiliateWebUrl?: string;
  itemWebUrl: string;
  image?: { imageUrl: string };
  seller?: { username?: string; feedbackPercentage?: string };
  condition?: string;
};

let spent = 0;
let stopped = false;

async function search(tok: string, c: Candidate): Promise<EbayListing | null | "skip"> {
  if (stopped || spent >= BUDGET) return "skip";
  spent++;
  const m = MARKET[c.region];
  const lo = Math.max(MIN_PRICE, Math.floor(c.p.bestPrice * 0.45));
  const hi = Math.ceil(c.p.bestPrice * 1.35);
  const q = `${c.p.brand} ${c.p.model}`.slice(0, 100);
  const filter = [`conditionIds:{1000}`, `buyingOptions:{FIXED_PRICE}`, `itemLocationCountry:${m.country}`, `deliveryCountry:${m.country}`, `price:[${lo}..${hi}]`, `priceCurrency:${m.currency}`].join(",");
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}&sort=price&limit=25`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${tok}`,
        "X-EBAY-C-MARKETPLACE-ID": m.id,
        // Makes eBay return itemAffiliateWebUrl tracked to our EPN campaign.
        "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_CAMPAIGN_ID},affiliateReferenceId=ce-${c.region}-${c.p.category},contextualLocation=${encodeURIComponent(`country=${m.country},zip=${m.zip}`)}`,
      },
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (res?.status === 429) {
      console.warn("eBay rate limit reached; stopping for today");
      stopped = true;
      return "skip";
    }
    if (!res || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!res.ok) return null;
    const body = (await res.json()) as { itemSummaries?: Summary[] };
    const need = mustHave(c.p);
    // Only a listing whose postage eBay states, in the region's currency; the cheapest delivered (item + postage) wins.
    const postage = (s: Summary): number | null => {
      const c = s.shippingOptions?.[0]?.shippingCost;
      if (!c || c.value == null || (c.currency && c.currency !== m.currency)) return null;
      const n = Number(c.value);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const ok = (body.itemSummaries ?? []).filter((s) => {
      const t = norm(s.title);
      return s.price && postage(s) != null && !NOT_THE_PRODUCT.test(s.title) && need.every((w) => t.includes(w));
    });
    const best = ok.sort((a, b) => Number(a.price!.value) + postage(a)! - (Number(b.price!.value) + postage(b)!))[0];
    if (!best) return null;
    return {
      price: Number(best.price!.value),
      shipping: postage(best)!,
      title: best.title,
      url: best.itemAffiliateWebUrl ?? best.itemWebUrl,
      image: best.image?.imageUrl,
      seller: best.seller?.username,
      feedback: best.seller?.feedbackPercentage ? Number(best.seller.feedbackPercentage) : undefined,
      checkedAt: new Date().toISOString(),
    };
  }
  return null;
}

async function main() {
  if (!ID || !SECRET) {
    console.log("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not set; skipping eBay prices.");
    return;
  }
  const files = Object.fromEntries(REGION_IDS.map((r) => [r, loadFile(r)])) as Record<RegionId, EbayFile>;
  const all: Candidate[] = REGION_IDS.flatMap((region) =>
    loadCatalog(region)
      .filter((p) => p.bestPrice >= MIN_PRICE)
      .map((p) => {
        const key = `${p.category}/${p.slug}`;
        return { region, key, p, demand: demand(p, region), last: files[region].checked[key] };
      }),
  );
  // Tier 1: the most in-demand quarter of the budget, every day. Tier 2: the rest, stalest first.
  const byDemand = [...all].sort((a, b) => b.demand - a.demand);
  const daily = byDemand.slice(0, Math.floor(BUDGET * 0.25));
  const dailyKeys = new Set(daily.map((c) => `${c.region}:${c.key}`));
  const age = (c: Candidate) => (c.last ? Date.now() - Date.parse(c.last) : Infinity);
  // Never-checked products first (most in demand first), then the largest demand × days since checked.
  const rank = (c: Candidate) => (c.last ? c.demand * age(c) : Number.MAX_VALUE / 2 + c.demand);
  const rest = byDemand.filter((c) => !dailyKeys.has(`${c.region}:${c.key}`)).sort((a, b) => rank(b) - rank(a));
  const queue = [...daily, ...rest].slice(0, BUDGET);
  console.log(`eBay: ${all.length} products ≥ ${MIN_PRICE}; checking ${queue.length} today (${daily.length} daily, ${queue.length - daily.length} rotating)`);

  const tok = await token();
  let found = 0;
  await pool(queue, 6, async (c) => {
    const r = await search(tok, c);
    if (r === "skip") return;
    const f = files[c.region];
    f.checked[c.key] = new Date().toISOString();
    if (r) {
      f.listings[c.key] = r;
      found++;
    } else delete f.listings[c.key];
  });

  // Drop listings older than 5 days: an eBay price that old is likely gone.
  const cutoff = Date.now() - 5 * 86_400_000;
  for (const region of REGION_IDS) {
    const f = files[region];
    for (const [k, l] of Object.entries(f.listings)) if (Date.parse(l.checkedAt) < cutoff) delete f.listings[k];
    const anyCatalog = CATEGORIES.some((c) => existsSync(`${dataPath(region, c.id)}/catalog.json`));
    if (!anyCatalog) continue;
    f.updatedAt = new Date().toISOString();
    mkdirSync(dataPath(region) || "data", { recursive: true });
    writeFileSync(fileOf(region), JSON.stringify(f) + "\n");
  }
  const status = { ranAt: new Date().toISOString(), budget: BUDGET, spent, found, rateLimited: stopped, candidates: all.length };
  writeFileSync("data/ebay-status.json", JSON.stringify(status, null, 1) + "\n");
  console.log(`eBay: spent ${spent} calls, found ${found} listings${stopped ? " (stopped at rate limit)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
