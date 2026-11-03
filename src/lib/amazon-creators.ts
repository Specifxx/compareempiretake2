/**
 * Amazon's Creators API (it replaced PA-API 5 in 2026), script-side only: GitHub Actions finds ASINs
 * (scripts/amazon-asins.ts) and each build fetches today's prices (scripts/fetch-amazon-prices.ts). No
 * page, component or route imports this file (tests/amazon-api.test.ts).
 *
 * Access (owner's AU Associates account, approved 2026-11-03): Associates Central → Tools → Creators API →
 * Create Application → Add New Credential. Amazon opens it only to accounts with qualifying sales (third-party
 * guides say 10 in the last 30 days) and suspends it after 30 days without one; a refused call is a 403/429 and
 * the site keeps its "Check price on Amazon" row. Limits: 1 request a second and 8,640 a day at first, then
 * scaled by shipped revenue; one call is one request however many ASINs it carries (getItems takes ten).
 *
 * Credentials: AMAZON_CREATORS_AU_CLIENT_ID / _CLIENT_SECRET / _VERSION, GitHub secrets and Vercel variables,
 * never in the repo. The version (3.1 NA, 3.2 EU, 3.3 FE) is printed beside the credential and picks the
 * Login with Amazon token endpoint; the AU store is in FE, so 3.3 is the default.
 * Docs: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl
 */
export const CREATORS_API = "https://creatorsapi.amazon/catalog/v1";

const TOKEN_ENDPOINTS: Record<string, string> = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

export type AmazonMarket = "au" | "us" | "uk";
export const MARKETPLACE: Record<AmazonMarket, string> = { au: "www.amazon.com.au", us: "www.amazon.com", uk: "www.amazon.co.uk" };
const DEFAULT_VERSION: Record<AmazonMarket, string> = { au: "3.3", us: "3.1", uk: "3.2" };
export const CURRENCY: Record<AmazonMarket, string> = { au: "AUD", us: "USD", uk: "GBP" };

/** The token endpoint for a credential version; an unknown version falls back to the market's home region. */
export function tokenEndpoint(version: string | undefined, market: AmazonMarket): string {
  return TOKEN_ENDPOINTS[(version ?? "").trim()] ?? TOKEN_ENDPOINTS[DEFAULT_VERSION[market]];
}

export interface Credentials { id: string; secret: string; version: string }

/** The market's credential from the environment, or null (then nothing runs and nothing fails). */
export function credentialsFor(market: AmazonMarket, env: Record<string, string | undefined> = process.env): Credentials | null {
  const k = `AMAZON_CREATORS_${market.toUpperCase()}_`;
  const id = env[`${k}CLIENT_ID`]?.trim();
  const secret = env[`${k}CLIENT_SECRET`]?.trim();
  if (!id || !secret) return null;
  return { id, secret, version: env[`${k}VERSION`]?.trim() || DEFAULT_VERSION[market] };
}

export interface Listing {
  price?: { money?: { amount?: number; currency?: string } };
  condition?: { value?: string };
  availability?: { type?: string };
  merchantInfo?: { name?: string };
  isBuyBoxWinner?: boolean;
}
export interface Item { asin: string; detailPageURL?: string; itemInfo?: { title?: { displayValue?: string } }; offersV2?: { listings?: Listing[] } | null }
interface Body { searchResult?: { items?: Item[] }; itemResults?: { items?: Item[] }; itemsResult?: { items?: Item[] } }

/** Items from either operation's response (GetItems answers `itemResults`; older docs said `itemsResult`). */
export const itemsOf = (b: Body): Item[] => b.searchResult?.items ?? b.itemResults?.items ?? b.itemsResult?.items ?? [];

// OffersV2 availability that can be bought today ("IN_STOCK_SCARCE" is "Only 3 left").
const BUYABLE = new Set(["IN_STOCK", "IN_STOCK_SCARCE"]);

/**
 * The price we show for an item: the buy-box listing if it is new, in stock and in the market's currency,
 * else the cheapest such listing. Null when none qualifies (the row then says "Check price on Amazon").
 */
export function pickListing(item: Item, currency: string): { amount: number; seller?: string } | null {
  const ok = (item.offersV2?.listings ?? []).filter(
    (l) => l.condition?.value === "New" && BUYABLE.has(l.availability?.type ?? "") && l.price?.money?.currency === currency && (l.price?.money?.amount ?? 0) > 0,
  );
  if (!ok.length) return null;
  const best = ok.find((l) => l.isBuyBoxWinner) ?? [...ok].sort((a, b) => a.price!.money!.amount! - b.price!.money!.amount!)[0];
  const seller = best.merchantInfo?.name;
  return { amount: best.price!.money!.amount!, seller: seller && !/^amazon/i.test(seller) ? seller : undefined };
}

export const PRICE_RESOURCES = [
  "itemInfo.title",
  "offersV2.listings.price",
  "offersV2.listings.condition",
  "offersV2.listings.availability",
  "offersV2.listings.merchantInfo",
  "offersV2.listings.isBuyBoxWinner",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class AmazonRefused extends Error {}

/** A signed-in caller for one market: one request a second, stops on 401/403/429 (access closed or limit hit). */
export async function creatorsClient(market: AmazonMarket, tag: string, creds: Credentials) {
  const tok = await fetch(tokenEndpoint(creds.version, market), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: creds.id, client_secret: creds.secret, scope: "creatorsapi::default" }),
  });
  if (!tok.ok) throw new AmazonRefused(`token ${tok.status}`);
  const bearer = ((await tok.json()) as { access_token: string }).access_token;
  const marketplace = MARKETPLACE[market];
  let calls = 0;
  async function call(op: "searchItems" | "getItems", body: object): Promise<Item[]> {
    calls++;
    const res = await fetch(`${CREATORS_API}/${op}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json", "x-marketplace": marketplace },
      body: JSON.stringify({ partnerTag: tag, marketplace, ...body }),
    });
    await sleep(1100);
    if (res.status === 401 || res.status === 403 || res.status === 429) throw new AmazonRefused(`${op} ${res.status} ${(await res.text()).slice(0, 160)}`);
    if (!res.ok) throw new Error(`${op} ${res.status} ${(await res.text()).slice(0, 160)}`);
    return itemsOf((await res.json()) as Body);
  }
  return { call, calls: () => calls };
}
