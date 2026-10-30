/** One-off probe (removed before merge): where do AU stores list home appliances, and how many? */
import { get, pool, sleep } from "../lib/http";

const KW = /fridge|refrigerat|freezer|washing|washer|dryer|dishwash|vacuum|stick-vac|air-fryer|airfryer|coffee|espresso|kettle|toaster|microwave|blender|mixer|air-purif|purifier|heater|heating|fan|air-con|cooling|dehumid|oven|cooktop|rangehood|kitchen|appliance|laundry|floorcare|cleaning/i;
const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };

function hrefs(html: string, base: string): string[] {
  const s = new Set<string>();
  for (const [, h] of html.matchAll(/href="([^"#]+)"/g)) {
    let u = h.replace(/&amp;/g, "&");
    if (u.startsWith(base)) u = u.slice(base.length);
    if (!u.startsWith("/") || u.startsWith("//")) continue;
    u = u.split("?")[0];
    if (KW.test(u) && !/\/products?\/|\.html$|\/p\/\d/.test(u)) s.add(u);
  }
  return [...s].sort();
}

async function goodGuys() {
  const B = "https://www.thegoodguys.com.au";
  const seeds = ["/", "/kitchen-appliances", "/small-kitchen-appliances", "/whitegoods", "/vacuums-and-cleaners", "/laundry", "/heating-and-cooling", "/refrigerators-and-freezers", "/dishwashers", "/cooking", "/coffee-machines"];
  const all = new Set<string>();
  for (const s of seeds) { try { for (const h of hrefs(await get(B + s, 2), B)) all.add(h); } catch (e) { log(`tgg seed ${s}: ${(e as Error).message}`); } await sleep(600); }
  log(`tgg: ${all.size} keyword paths`);
  for (const p of [...all].slice(0, 140)) {
    try {
      const html = await get(`${B}${p}?page=1`, 2);
      const cards = html.split('data-testid="product-card"').length - 1;
      const total = html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1];
      const names = [...html.matchAll(/data-cnstrc-item-name="([^"]*)"/g)].slice(0, 2).map((m) => m[1]);
      if (cards) log(`tgg ${p} cards=${cards} total=${total} e.g. ${names.join(" | ")}`);
    } catch (e) { log(`tgg ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

async function harvey() {
  const B = "https://www.harveynorman.com.au";
  const seeds = ["/", "/kitchen-appliances", "/vacuum-laundry-appliances", "/fridges-freezers", "/heating-cooling", "/coffee-machines", "/small-appliances", "/kitchen-appliances/coffee-machines", "/dishwashers"];
  const all = new Set<string>();
  for (const s of seeds) { try { for (const h of hrefs(await get(B + s, 2), B)) all.add(h); } catch (e) { log(`hn seed ${s}: ${(e as Error).message}`); } await sleep(600); }
  log(`hn: ${all.size} keyword paths`);
  for (const p of [...all].slice(0, 160)) {
    try {
      const html = await get(`${B}${p}?p=1`, 2);
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      const pd = m ? JSON.parse(m[1]).props?.pageProps?.pageProps?.pageData?.productsData : undefined;
      if (pd?.items?.length) log(`hn ${p} items=${pd.items.length} pages=${pd.page_info?.total_pages} total=${pd.total_count} e.g. ${pd.items.slice(0, 2).map((i: { name: string; sku: string }) => `${i.name} [${i.sku}]`).join(" | ")}`);
    } catch (e) { log(`hn ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

async function betta() {
  const B = "https://www.betta.com.au";
  for (let page = 1; page <= 6; page++) {
    try {
      const { collections } = JSON.parse(await get(`${B}/collections.json?limit=250&page=${page}`, 2)) as { collections: { handle: string; products_count: number }[] };
      if (!collections.length) break;
      for (const c of collections) if (KW.test(c.handle)) log(`betta ${c.handle} ${c.products_count}`);
    } catch (e) { log(`betta collections p${page}: ${(e as Error).message}`); break; }
    await sleep(600);
  }
}

async function costco() {
  const B = "https://www.costco.com.au";
  const all = new Set<string>();
  for (const s of ["/Appliances/c/cos_2", "/Kitchen-Dining/c/cos_7", "/Home-Appliances/c/cos_2"]) {
    try { const html = await get(B + s, 2); for (const [, h] of html.matchAll(/href="(\/[^"]*\/c\/cos_[\d.]+)"/g)) all.add(h); } catch (e) { log(`costco seed ${s}: ${(e as Error).message}`); }
    await sleep(600);
  }
  for (const p of [...all].filter((x) => KW.test(x)).slice(0, 80)) {
    try {
      const html = await get(`${B}${p}?currentPage=0`, 2);
      const n = html.split(/(?=<a[^>]*class="thumb"[^>]*href="[^"]*\/p\/\d+")/).length - 1;
      const t = [...html.matchAll(/class="thumb"[^>]*title="([^"]+)"/g)].slice(0, 2).map((m) => m[1]);
      log(`costco ${p} tiles=${n} e.g. ${t.join(" | ")}`);
    } catch (e) { log(`costco ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

const JB_KW: Record<string, RegExp> = {
  "air-fryer": /air-?fryer/, coffee: /coffee-machine|espresso|nespresso|barista|bean-to-cup/, "stick-vac": /stick-vac|cordless-vac|dyson-v\d|dyson-gen|shark.*vac|handstick/,
  fridge: /fridge|refrigerator|freezer/, washer: /washing-machine|washer|front-load|top-load/, dryer: /dryer/, dishwasher: /dishwasher/, microwave: /microwave/, purifier: /purifier/, fan: /-fan-|tower-fan|pedestal-fan/, heater: /heater/, kettle: /kettle/, blender: /blender/, mixer: /stand-mixer|kitchenaid/, aircon: /air-conditioner|portable-air/,
};
async function jb() {
  const B = "https://www.jbhifi.com.au";
  const index = await get(`${B}/sitemap.xml`);
  const maps = [...index.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const hs: string[] = [];
  for (const m of maps) { const xml = await get(m); for (const [, l] of xml.matchAll(/\/products\/([^<]+)<\/loc>/g)) hs.push(l); await sleep(150); }
  log(`jb: ${hs.length} product handles`);
  for (const [k, re] of Object.entries(JB_KW)) { const hit = hs.filter((h) => re.test(h)); log(`jb ${k}: ${hit.length} e.g. ${hit.slice(0, 3).join(" | ")}`); }
  for (const h of hs.filter((x) => /air-fryer|coffee-machine|washing-machine|fridge/.test(x)).slice(0, 4)) {
    try { const { product: p } = JSON.parse(await get(`${B}/products/${h}.json`, 2)); log(`jb type ${h}: ${p.product_type} sku=${p.variants[0].sku} $${p.variants[0].price}`); } catch (e) { log(`jb ${h}: ${(e as Error).message}`); }
    await sleep(1500);
  }
}

const OTHER = [
  "appliancesonline.com.au", "binglee.com.au", "kitchenwarehouse.com.au", "myer.com.au", "davidjones.com", "bigw.com.au", "kmart.com.au", "target.com.au", "winningappliances.com.au", "retravision.com.au", "eands.com.au", "officeworks.com.au", "catch.com.au", "kogan.com/au",
  "godfreys.com.au", "dyson.com.au", "breville.com/en-au", "ninjakitchen.com.au", "sharkninja.com.au", "sharkclean.com.au", "delonghi.com/en-au", "philips.com.au", "tineco.com.au", "au.roborock.com", "hoover.com.au", "vax.com.au", "bissell.com.au", "samsung.com/au", "lg.com/au", "smeg.com.au", "kitchenaid.com.au", "sunbeam.com.au", "russellhobbs.com.au", "tefal.com.au", "nespresso.com/au", "kenwoodworld.com/en-au", "instantbrands.com.au", "ecovacs.com/au", "dreame.com.au",
  "everten.com.au", "petersofkensington.com.au", "chefshat.com.au", "house.com.au", "matchbox.com.au", "minimax.com.au", "myhouse.com.au", "cookwarebrands.com.au", "zestkitchen.com.au", "victoriaroadkitchen.com.au", "homeandkitchen.com.au",
  "coffeeparts.com.au", "jetblackespresso.com.au", "dipacci.com.au", "alternativebrewing.com.au", "coffeemachinewarehouse.com.au", "coffeeworks.com.au", "espressomechanics.com.au", "baristatools.com.au", "coffeesnobs.com.au", "theespressoworks.com.au", "espressodave.com.au", "coffeemachinesdirect.com.au", "beanbaristas.com.au", "coffeeco.com.au", "zarraffas.com", "sabbiacoffee.com.au", "coffeesupplies.com.au",
  "andatech.com.au", "appliancecentral.com.au", "thevacuumcentre.com.au", "vacuumcleanerwarehouse.com.au", "vacuumsonline.com.au", "thevacuumshop.com.au", "vacspares.com.au", "mrvacuum.com.au", "e-vac.com.au",
  "mwave.com.au", "digidirect.com.au", "appliancesdirect.com.au", "harveynorman.com.au", "thegoodguys.com.au", "jbhifi.com.au", "betta.com.au", "costco.com.au",
];
const SH: Record<string, RegExp> = { airfryer: /air ?fryer/i, coffee: /coffee machine|espresso machine|espresso maker|bean to cup|nespresso|barista/i, stickvac: /stick vac|cordless vac|handstick|dyson v\d|dyson gen/i, fridge: /fridge|refrigerator/i, washer: /washing machine|front load washer|top load washer/i, dishwasher: /dishwasher/i, purifier: /air purifier/i };

async function other(host: string) {
  const base = `https://${host.includes("/") ? host : "www." + host}`.replace("www.au.", "au.");
  let status = "";
  try { const r = await fetch(base + "/", { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" }, redirect: "follow", signal: AbortSignal.timeout(20000) }); status = `${r.status} ${r.url}`; } catch (e) { status = `ERR ${(e as Error).message}`; }
  const root = (() => { try { return new URL(status.split(" ")[1] ?? base).origin + (host.includes("/") ? "/" + host.split("/").slice(1).join("/") : ""); } catch { return base; } })();
  const counts: Record<string, number> = {};
  let n = 0, shop = "no";
  for (let page = 1; page <= 12; page++) {
    try {
      const { products } = JSON.parse(await get(`${root.replace(/\/$/, "")}/products.json?limit=250&page=${page}`, 1)) as { products: { title: string; product_type: string; variants: { price: string }[] }[] };
      shop = "shopify";
      if (!products?.length) break;
      n += products.length;
      for (const p of products) for (const [k, re] of Object.entries(SH)) if (re.test(`${p.title} ${p.product_type}`) && Number(p.variants[0]?.price) >= 60) counts[k] = (counts[k] ?? 0) + 1;
      if (products.length < 250) break;
    } catch { break; }
    await sleep(1100);
  }
  log(`other ${host}: ${status} | ${shop} products=${n} ${JSON.stringify(counts)}`);
}

async function main() {
  await Promise.all([
    goodGuys().catch((e) => log(`tgg FAIL ${e.message}`)),
    harvey().catch((e) => log(`hn FAIL ${e.message}`)),
    betta().catch((e) => log(`betta FAIL ${e.message}`)),
    costco().catch((e) => log(`costco FAIL ${e.message}`)),
    jb().catch((e) => log(`jb FAIL ${e.message}`)),
    pool(OTHER, 3, (h) => other(h)),
  ]);
  console.log("\n===== SUMMARY =====\n" + out.sort().join("\n"));
}
main();
