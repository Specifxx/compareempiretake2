/** One-off probe (removed before merge), round 2: exact paths and sample listings. */
import { get, pool, sleep } from "../lib/http";

const KW = /fridge|refrigerat|freezer|washing|washer|dryer|dishwash|vacuum|stick|air-fryer|airfryer|coffee|espresso|laundry|floorcare|small-kitchen|kitchen-appliances/i;
const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };

async function goodGuys() {
  const B = "https://www.thegoodguys.com.au";
  const all = new Set<string>();
  for (const s of ["/", "/laundry", "/small-kitchen-appliances", "/vacuums-and-cleaners", "/vacuums-and-cleaning"]) {
    try {
      const html = await get(B + s, 2);
      for (const [, h] of html.matchAll(/href="(\/[a-z0-9\-/]+)"/g)) if (/^\/(laundry|small-kitchen-appliances|vacuums-and-clean\w*|coffee)/.test(h)) all.add(h);
    } catch (e) { log(`tgg seed ${s}: ${(e as Error).message}`); }
    await sleep(600);
  }
  for (const p of [...all].sort()) {
    try {
      const html = await get(`${B}${p}?page=1`, 2);
      const cards = html.split('data-testid="product-card"').slice(1);
      const total = html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1];
      const ex = cards.slice(0, 3).map((c) => `${c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1]} <${c.match(/href="(\/[^"#?]+)"/)?.[1]}>`);
      if (cards.length) log(`tgg ${p} cards=${cards.length} total=${total} :: ${ex.join(" | ")}`);
    } catch (e) { log(`tgg ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

async function harvey() {
  const B = "https://www.harveynorman.com.au";
  const all = new Set<string>();
  for (const s of ["/", "/vacuum-laundry-appliances", "/kitchen-appliances", "/fridges-freezers", "/dishwashers-cooking", "/vacuum-laundry-appliances/vacuum-cleaners", "/vacuum-laundry-appliances/laundry"]) {
    try {
      const html = await get(B + s, 2);
      log(`hn seed ${s}: ${html.length} bytes, nextdata=${html.includes("__NEXT_DATA__")}`);
      for (const [, h] of html.matchAll(/"(\/[a-z0-9][a-z0-9\-/]{4,})"/g)) if (KW.test(h) && !/\.(html|js|css|png|jpg|svg)/.test(h)) all.add(h.replace(/\/$/, ""));
      for (const [, h] of html.matchAll(/https:\/\/www\.harveynorman\.com\.au(\/[a-z0-9][a-z0-9\-/]{4,})/g)) if (KW.test(h) && !/\.(html|js|css|png|jpg|svg)/.test(h)) all.add(h.replace(/\/$/, ""));
    } catch (e) { log(`hn seed ${s}: ${(e as Error).message}`); }
    await sleep(600);
  }
  log(`hn: ${all.size} keyword paths`);
  for (const p of [...all].sort().slice(0, 150)) {
    try {
      const html = await get(`${B}${p}?p=1`, 2);
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      const pd = m ? JSON.parse(m[1]).props?.pageProps?.pageProps?.pageData?.productsData : undefined;
      if (pd?.items?.length) log(`hn ${p} items=${pd.items.length} pages=${pd.page_info?.total_pages} :: ${pd.items.slice(0, 3).map((i: { name: string; sku: string }) => `${i.name} [${i.sku}]`).join(" | ")}`);
    } catch (e) { log(`hn ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

type P = { title: string; handle: string; vendor: string; product_type: string; tags: string | string[]; variants: { sku: string; price: string; title: string; barcode?: string }[] };
async function shop(host: string, re: RegExp) {
  const types = new Map<string, number>(), vendors = new Map<string, number>();
  const ex: string[] = [];
  let n = 0;
  for (let page = 1; page <= 20; page++) {
    let products: P[];
    try { products = (JSON.parse(await get(`https://${host}/products.json?limit=250&page=${page}`, 2)) as { products: P[] }).products; } catch (e) { log(`shop ${host} p${page}: ${(e as Error).message}`); break; }
    if (!products.length) break;
    for (const p of products) {
      if (!re.test(`${p.title} ${p.product_type}`)) continue;
      n++;
      types.set(p.product_type, (types.get(p.product_type) ?? 0) + 1);
      vendors.set(p.vendor, (vendors.get(p.vendor) ?? 0) + 1);
      if (ex.length < 12) ex.push(`${p.title} [${p.product_type}] sku=${p.variants[0]?.sku} $${p.variants[0]?.price} v=${p.variants.length}`);
    }
    if (products.length < 250) break;
    await sleep(1200);
  }
  const top = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${v}`).join(", ");
  log(`shop ${host}: ${n} matching | types ${top(types)} | vendors ${top(vendors)}`);
  for (const e of ex) log(`shop ${host} ex: ${e}`);
  try { const cs = (JSON.parse(await get(`https://${host}/collections.json?limit=250`, 2)) as { collections: { handle: string; products_count: number }[] }).collections; log(`shop ${host} collections: ${cs.filter((c) => KW.test(c.handle) || /machine|vac|fryer/.test(c.handle)).map((c) => `${c.handle}(${c.products_count})`).join(", ")}`); } catch { /* none */ }
}

const COFFEE = /coffee machine|espresso machine|espresso coffee machine|automatic coffee|bean to cup|machine/i;
async function main() {
  await Promise.all([
    goodGuys().catch((e) => log(`tgg FAIL ${e.message}`)),
    harvey().catch((e) => log(`hn FAIL ${e.message}`)),
    pool(
      [
        ["coffeemachinewarehouse.com.au", COFFEE], ["dipacci.com.au", COFFEE], ["alternativebrewing.com.au", COFFEE],
        ["sharkninja.com.au", /vac|fryer|coffee|espresso/i], ["www.godfreys.com.au", /vac/i], ["thevacuumshop.com.au", /vac/i], ["www.tefal.com.au", /fryer|vac/i],
        ["bissell.com.au", /vac/i], ["kitchenaid.com.au", /coffee|espresso/i],
      ] as [string, RegExp][],
      2,
      ([h, re]) => shop(h, re),
    ),
  ]);
  console.log("\n===== SUMMARY =====\n" + out.sort().join("\n"));
}
main();
