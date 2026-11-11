/**
 * One-off trial of Google Shopping prices through DataForSEO's Merchant API (owner, 2026-11-11: "we really need the big
 * stores", Impact and Awin approvals not landing; DataForSEO's free US$1 trial credit only, no deposit).
 *
 * What it answers, with real numbers and no guessing: for the products shoppers compare most in AU, US and UK, which big
 * stores does Google Shopping show a price for, how often, and does the price agree with the stores we already read?
 * It writes docs/shopping-trial/<date>.json (counts, store domains, price agreement, a sample to check by eye and the
 * raw shape of the API's first answers) and nothing else: no price from here reaches a page.
 *
 * Rules kept: only DataForSEO's API (a licensed data service), never a store page; a hard spend cap read from each
 * task's own `cost` field (SHOPPING_TRIAL_MAX_USD, default 0.60, never more than the credit); searches per region
 * SHOPPING_TRIAL_PER_REGION (default 40). Off (exit 0) until DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD exist.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const REGIONS = { au: { root: "data", loc: 2036 }, us: { root: "data/us", loc: 2840 }, uk: { root: "data/uk", loc: 2826 } } as const;
type Reg = keyof typeof REGIONS;

/** The big stores a shopper expects, by region (domains Google lists them under). Used only to count and report. */
export const BIG: Record<Reg, string[]> = {
  au: ["harveynorman.com.au", "bigw.com.au", "kmart.com.au", "target.com.au", "bunnings.com.au", "binglee.com.au", "kogan.com", "catch.com.au", "myer.com.au", "davidjones.com", "appliancesonline.com.au", "scorptec.com.au", "pccasegear.com", "centrecom.com.au", "mobileciti.com.au", "officeworks.com.au", "jbhifi.com.au", "thegoodguys.com.au", "amazon.com.au"],
  us: ["walmart.com", "bestbuy.com", "target.com", "homedepot.com", "lowes.com", "newegg.com", "bhphotovideo.com", "adorama.com", "costco.com", "samsclub.com", "macys.com", "kohls.com", "staples.com", "officedepot.com", "gamestop.com", "microcenter.com", "amazon.com"],
  uk: ["currys.co.uk", "argos.co.uk", "johnlewis.com", "ao.com", "very.co.uk", "boots.com", "tesco.com", "sainsburys.co.uk", "scan.co.uk", "ebuyer.com", "richersounds.com", "box.co.uk", "amazon.co.uk", "wex.co.uk"],
};

const auth = () => "Basic " + Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const num = (x: any): number => (typeof x === "number" ? x : typeof x === "string" ? Number(x.replace(/[^0-9.]/g, "")) : Number(x?.current ?? x?.value ?? x?.amount ?? NaN));
let spent = 0;

async function task(kind: "products" | "sellers", body: object, waitMs = 120_000): Promise<any | null> {
  const base = `https://api.dataforseo.com/v3/merchant/google/${kind}`;
  const post = await fetch(`${base}/task_post`, { method: "POST", headers: { authorization: auth(), "content-type": "application/json" }, body: JSON.stringify([{ ...body, language_code: "en", priority: 2 }]), signal: AbortSignal.timeout(15_000) });
  const pj: any = await post.json().catch(() => null);
  spent += Number(pj?.cost ?? 0);
  const id = pj?.tasks?.[0]?.id;
  if (!post.ok || !id) { console.warn(`${kind} post ${post.status}: ${String(pj?.tasks?.[0]?.status_message ?? pj?.status_message ?? "").slice(0, 120)}`); return null; }
  for (const until = Date.now() + waitMs; Date.now() < until; ) {
    await sleep(6_000);
    const r = await fetch(`${base}/task_get/advanced/${id}`, { headers: { authorization: auth() }, signal: AbortSignal.timeout(15_000) });
    const j: any = await r.json().catch(() => null);
    const code = j?.tasks?.[0]?.status_code;
    if (code === 20000) { return j; }
    if (code && code !== 40602 && code !== 20100) { console.warn(`${kind} task ${code}: ${j?.tasks?.[0]?.status_message}`); return null; }
  }
  return null;
}

interface Pick { region: Reg; category: string; slug: string; name: string; ours: number[]; stores: number }

function picks(region: Reg, n: number): Pick[] {
  const { root } = REGIONS[region];
  const byCat: Pick[][] = [];
  for (const d of readdirSync(root, { withFileTypes: true })) {
    const f = `${root}/${d.name}/catalog.json`;
    if (!d.isDirectory() || !existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, "utf8"));
    const key = Object.keys(j).find((k) => Array.isArray(j[k]) && k !== "retailers");
    if (!key) continue;
    const list: Pick[] = [];
    for (const p of j[key]) {
      const offers = (p.variants ?? []).flatMap((v: any) => v.offers ?? []).filter((o: any) => o.inStock !== false && o.price > 0);
      const stores = new Set(offers.map((o: any) => o.retailer)).size;
      if (stores >= 3) list.push({ region, category: d.name, slug: p.slug, name: p.name, ours: offers.map((o: any) => o.price), stores });
    }
    list.sort((a, b) => b.stores - a.stores);
    if (list.length) byCat.push(list);
  }
  const out: Pick[] = [];
  for (let i = 0; out.length < n && byCat.some((l) => l[i]); i++) for (const l of byCat) if (l[i] && out.length < n) out.push(l[i]);
  return out;
}

async function main() {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) { console.log("No DATAFORSEO_LOGIN/PASSWORD: trial not run."); return; }
  const per = Number(process.env.SHOPPING_TRIAL_PER_REGION || 40);
  const cap = Number(process.env.SHOPPING_TRIAL_MAX_USD || 0.6);
  const withSellers = process.env.SHOPPING_TRIAL_SELLERS !== "0";
  const report: any = { ranAt: new Date().toISOString(), perRegion: per, regions: {} as Record<string, any>, rawShapes: [] as unknown[] };
  for (const region of Object.keys(REGIONS) as Reg[]) {
    const r = { searches: 0, withAnyItem: 0, withBigStore: 0, bigHits: {} as Record<string, number>, otherHosts: {} as Record<string, number>, priceBands: { within: 0, outside: 0 }, sample: [] as unknown[] };
    for (const p of picks(region, per)) {
      if (spent >= cap) break;
      r.searches++;
      const j = await task("products", { keyword: p.name.slice(0, 150), location_code: REGIONS[region].loc, depth: 40 });
      const items: any[] = j?.tasks?.[0]?.result?.[0]?.items ?? [];
      if (report.rawShapes.length < 3 && items[0]) report.rawShapes.push(JSON.parse(JSON.stringify(items[0], (k, v) => (typeof v === "string" ? v.slice(0, 120) : v))));
      let offers: { title: string; price: number; domain: string; url: string }[] = [];
      for (const i of items) {
        const price = num(i.price ?? i.price_current);
        const url = String(i.url ?? i.shopping_url ?? "");
        const domain = String(i.domain ?? host(url)).replace(/^www\./, "");
        if (price > 0 && domain) offers.push({ title: String(i.title ?? ""), price, domain, url });
      }
      // The product list is Google's product tiles; the sellers call lists each store's price for the first tile.
      const first = items.find((i) => i.product_id || i.data_docid);
      if (withSellers && first && spent < cap) {
        const s = await task("sellers", { product_id: first.product_id, data_docid: first.data_docid, location_code: REGIONS[region].loc });
        for (const i of s?.tasks?.[0]?.result?.[0]?.items ?? []) {
          const price = num(i.price ?? i.price_current ?? i.base_price);
          const url = String(i.url ?? i.shopping_url ?? "");
          const domain = String(i.domain ?? host(url)).replace(/^www\./, "");
          if (price > 0 && domain) offers.push({ title: String(i.title ?? first.title ?? ""), price, domain, url });
        }
        if (report.rawShapes.length < 5 && s?.tasks?.[0]?.result?.[0]?.items?.[0]) report.rawShapes.push(JSON.parse(JSON.stringify(s.tasks[0].result[0].items[0], (k, v) => (typeof v === "string" ? v.slice(0, 120) : v))));
      }
      if (offers.length) r.withAnyItem++;
      const bigs = offers.filter((o) => BIG[region].some((b) => o.domain === b || o.domain.endsWith("." + b)));
      if (bigs.length) r.withBigStore++;
      const med = [...p.ours].sort((a, b) => a - b)[Math.floor(p.ours.length / 2)];
      for (const o of offers) {
        const big = BIG[region].find((b) => o.domain === b || o.domain.endsWith("." + b));
        if (big) r.bigHits[big] = (r.bigHits[big] ?? 0) + 1; else r.otherHosts[o.domain] = (r.otherHosts[o.domain] ?? 0) + 1;
      }
      for (const o of bigs) { if (o.price >= med * 0.6 && o.price <= med * 1.6) r.priceBands.within++; else r.priceBands.outside++; }
      if (bigs.length && r.sample.length < 12) r.sample.push({ product: p.name, ourMedian: med, ourStores: p.stores, big: bigs.slice(0, 4).map((o) => ({ store: o.domain, price: o.price, title: o.title.slice(0, 90), url: o.url.slice(0, 160) })) });
    }
    r.otherHosts = Object.fromEntries(Object.entries(r.otherHosts).sort((a, b) => b[1] - a[1]).slice(0, 25));
    report.regions[region] = r;
    console.log(region, JSON.stringify({ searches: r.searches, withAnyItem: r.withAnyItem, withBigStore: r.withBigStore, bigHits: r.bigHits }));
  }
  report.spentUsd = Math.round(spent * 10_000) / 10_000;
  mkdirSync("docs/shopping-trial", { recursive: true });
  writeFileSync(`docs/shopping-trial/${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(report, null, 1) + "\n");
  console.log(`spent US$${report.spentUsd}`);
}
main();
