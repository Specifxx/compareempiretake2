/** One-off probe (removed before merge): which AU stores list the candidate new categories, and how many products. */
import { get, pool, sleep } from "../lib/http";

const KW = /hair|styler|straighten|curl|dryer|airwrap|tooth|oral|shaver|groom|trimmer|epilat|ipl|purifier|heater|\bfans?\b|cooling|dehumid|humidif|microwave|mixer|blender|food-processor|juicer|toaster|kettle|lego|toy|tool|drill|e-?bike|scooter|massage|baby|pram|stroller|car-seat|bbq|pizza|mower|garden|perfume|fragrance|watch|sewing|projector|e-?reader|kindle|ice-cream|thermomix|pressure-washer|blower|grill/i;
const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };

type C = { handle: string; title: string; products_count: number };
async function collections(host: string) {
  const found: C[] = [];
  for (let page = 1; page <= 6; page++) {
    let cs: C[];
    try { cs = (JSON.parse(await get(`https://${host}/collections.json?limit=250&page=${page}`, 2)) as { collections: C[] }).collections; } catch (e) { log(`coll ${host}: ${(e as Error).message}`); break; }
    found.push(...cs);
    if (cs.length < 250) break;
    await sleep(800);
  }
  const hit = found.filter((c) => KW.test(c.handle)).sort((a, b) => b.products_count - a.products_count);
  log(`coll ${host}: ${found.length} collections, ${hit.length} keyword :: ${hit.slice(0, 80).map((c) => `${c.handle}(${c.products_count})`).join(", ")}`);
}

type P = { title: string; product_type: string; vendor: string; variants: { sku: string; price: string; barcode?: string }[] };
async function shop(host: string, re: RegExp, label: string) {
  let n = 0;
  const vendors = new Map<string, number>();
  const ex: string[] = [];
  let total = 0;
  for (let page = 1; page <= 40; page++) {
    let products: P[];
    try { products = (JSON.parse(await get(`https://${host}/products.json?limit=250&page=${page}`, 2)) as { products: P[] }).products; } catch (e) { log(`shop ${label} ${host} p${page}: ${(e as Error).message}`); break; }
    total += products.length;
    for (const p of products) {
      if (!re.test(`${p.title} ${p.product_type} ${p.vendor}`)) continue;
      n++;
      vendors.set(p.vendor, (vendors.get(p.vendor) ?? 0) + 1);
      if (ex.length < 6) ex.push(`${p.title} [${p.product_type}] sku=${p.variants[0]?.sku} $${p.variants[0]?.price}`);
    }
    if (products.length < 250) break;
    await sleep(900);
  }
  const top = [...vendors].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(", ");
  log(`shop ${label} ${host}: ${n}/${total} matching | ${top} | ex: ${ex.join(" || ")}`);
}

async function ping(url: string) {
  try { const h = await get(url, 1); log(`ping ${url}: ok ${h.length}b shopify=${/Shopify|cdn\.shopify/.test(h)}`); } catch (e) { log(`ping ${url}: ${(e as Error).message}`); }
}

async function goodGuys() {
  const B = "https://www.thegoodguys.com.au";
  const all = new Set<string>();
  for (const s of ["/", "/health-and-beauty", "/heating-and-cooling", "/small-kitchen-appliances", "/cooking", "/outdoor"]) {
    try {
      const html = await get(B + s, 2);
      for (const [, h] of html.matchAll(/href="(\/[a-z0-9\-/]+)"/g)) if (KW.test(h) && h.split("/").length <= 4) all.add(h);
    } catch (e) { log(`tgg seed ${s}: ${(e as Error).message}`); }
    await sleep(600);
  }
  for (const p of [...all].sort().slice(0, 70)) {
    try {
      const html = await get(`${B}${p}?page=1`, 2);
      const cards = html.split('data-testid="product-card"').slice(1);
      const total = html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1];
      if (cards.length) log(`tgg ${p} total=${total} :: ${cards.slice(0, 2).map((c) => c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1]).join(" | ")}`);
    } catch (e) { log(`tgg ${p}: ${(e as Error).message}`); }
    await sleep(600);
  }
}

const LEGO = /\blego\b/i;
const HAIR = /hair ?dryer|straightener|styler|airwrap|supersonic|curl|ghd|flexstyle|toothbrush|sonicare|oral-?b|shaver|trimmer|clipper|ipl|epilator/i;
const TOOLS = /drill|driver|grinder|saw\b|nailer|blower|skin only|kit\b.*(ah|v\b)|brushless|milwaukee|makita|dewalt|ryobi|bosch/i;
const KITCH = /mixer|blender|food processor|microwave|purifier|heater|\bfan\b|dehumidifier|pizza oven|bbq|ninja creami|thermomix|kitchenaid/i;

async function main() {
  await Promise.all([
    goodGuys().catch((e) => log(`tgg FAIL ${e.message}`)),
    pool(["www.jbhifi.com.au", "www.betta.com.au", "www.shavershop.com.au", "www.toysrus.com.au", "www.mrtoys.com.au", "www.toyworld.com.au", "www.kidstuff.com.au", "www.hobbyco.com.au", "www.toolkitdepot.com.au", "www.toolswarehouse.com.au", "www.adorebeauty.com.au", "www.ozhairandbeauty.com", "www.myhaircare.com.au", "www.hairhouse.com.au", "www.sydneytools.com.au", "www.totaltools.com.au"], 3, (h) => collections(h)),
    pool(
      [
        ["www.shavershop.com.au", HAIR, "hair"], ["www.ozhairandbeauty.com", HAIR, "hair"], ["www.myhaircare.com.au", HAIR, "hair"], ["www.hairhouse.com.au", HAIR, "hair"],
        ["www.toysrus.com.au", LEGO, "lego"], ["www.mrtoys.com.au", LEGO, "lego"], ["www.toyworld.com.au", LEGO, "lego"], ["www.kidstuff.com.au", LEGO, "lego"], ["www.hobbyco.com.au", LEGO, "lego"], ["www.brickfans.com.au", LEGO, "lego"], ["www.thebrickplace.com.au", LEGO, "lego"], ["www.bricksandminifigs.com.au", LEGO, "lego"], ["www.brickworld.com.au", LEGO, "lego"], ["www.minifigs.com.au", LEGO, "lego"],
        ["www.toolkitdepot.com.au", TOOLS, "tools"], ["www.toolswarehouse.com.au", TOOLS, "tools"], ["www.tradetools.com.au", TOOLS, "tools"], ["www.mytoolshed.com.au", TOOLS, "tools"], ["www.ozzytools.com.au", TOOLS, "tools"],
        ["www.kitchenwarehouse.com.au", KITCH, "kitchen"], ["www.peters.com.au", KITCH, "kitchen"], ["www.myhouse.com.au", KITCH, "kitchen"], ["www.homeoftheunusual.com.au", KITCH, "kitchen"],
      ] as [string, RegExp, string][],
      3,
      ([h, re, l]) => shop(h, re, l),
    ),
    pool(["https://www.costco.com.au/", "https://www.bigw.com.au/", "https://www.target.com.au/", "https://www.myer.com.au/", "https://www.lego.com/en-au", "https://www.zingpopculture.com.au/", "https://www.ebgames.com.au/", "https://www.bunnings.com.au/", "https://www.priceline.com.au/", "https://www.chemistwarehouse.com.au/", "https://www.davidjones.com/", "https://www.mydeal.com.au/"], 3, ping),
  ]);
  console.log("\n===== SUMMARY =====\n" + out.sort().join("\n"));
}
main();
