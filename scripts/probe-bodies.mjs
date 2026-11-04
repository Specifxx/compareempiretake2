// Prints what matters in each body the probe fetched (scripts/probe-stores.yml "urls" input), since the sandbox
// cannot download a run's artifacts: small text bodies (robots.txt, sitemaps, JSON) whole, and for HTML the JSON-LD
// blocks, embedded state objects, price-bearing snippets and script hosts. Read-only; nothing is written.
import { readdirSync, readFileSync } from "node:fs";
const dir = process.argv[2] || "/tmp/bodies";
const LIMIT = Number(process.env.PROBE_PRINT_LIMIT || 6000);
const JSON_LIMIT = Number(process.env.PROBE_JSON_LIMIT || 40000);
for (const f of readdirSync(dir).filter((f) => !f.endsWith(".headers")).sort()) {
  const body = readFileSync(`${dir}/${f}`, "utf8");
  let headers = "";
  try { headers = readFileSync(`${dir}/${f}.headers`, "utf8"); } catch {}
  console.log(`\n######## ${f} (${body.length} bytes)`);
  const ct = headers.match(/^content-type:.*$/im)?.[0] ?? "";
  const server = headers.match(/^(server|x-powered-by|x-shopify-stage|x-sorting-hat-shopid|x-cache|cf-ray|x-akamai[^:]*|x-magento[^:]*|x-bc[^:]*):.*$/gim)?.join(" | ") ?? "";
  console.log(`-- ${ct} ${server}`.trim());
  const isHtml = /<html|<!doctype html/i.test(body.slice(0, 2000));
  if (/javascript/.test(ct) || /\.js(\?|\.txt$|$)/.test(f)) {
    // A script bundle: only the API paths and price-ish strings it names.
    const paths = new Set([...body.matchAll(/["'`](\/?(?:[a-z-]+\/)?api\/[A-Za-z0-9/_${}.?=&:-]{2,120})["'`]/g)].map((m) => m[1]));
    console.log(`-- api paths in bundle (${paths.size}): ${[...paths].slice(0, 150).join("  ")}`);
    const pricey = new Set([...body.matchAll(/["'`]([^"'`\n]{0,60}(?:price|pricing|availability|stock|search|products)[^"'`\n]{0,60})["'`]/gi)].map((m) => m[1]).filter((x) => /\/|\?/.test(x)));
    console.log(`-- price-ish strings (${pricey.size}): ${[...pricey].slice(0, 120).join("  ")}`);
    continue;
  }
  if (/<urlset|<sitemapindex/.test(body.slice(0, 2000))) {
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log(`-- sitemap: ${locs.length} urls; first: ${locs.slice(0, 15).join(" ")}`);
    const kw = locs.filter((u) => /tv|laptop|monitor|printer|ipad|tablet|headphone|router|speaker|iphone|phone|camera|drone|vacuum|coffee|fryer|watch|desktop|fridge|wash|dishwash|soundbar|console|playstation|xbox|nintendo|lego/i.test(u));
    console.log(`-- sitemap keyword urls: ${kw.length}; sample: ${kw.filter((_, i) => i % Math.max(1, Math.floor(kw.length / 40)) === 0).slice(0, 40).join(" ")}`);
    continue;
  }
  if (!isHtml || body.length < 4000) {
    console.log(body.slice(0, /^\s*[[{]/.test(body) ? JSON_LIMIT : LIMIT));
    continue;
  }
  const title = body.match(/<title[^>]*>([^<]{0,160})/i)?.[1];
  if (title) console.log(`title: ${title.trim()}`);
  const ld = [...body.matchAll(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim());
  for (const [i, j] of ld.entries()) {
    console.log(`-- ld+json #${i + 1} (${j.length} chars): ${j.slice(0, i === 0 ? 2500 : 600).replace(/\s+/g, " ")}`);
    if (i >= 3) break;
  }
  for (const key of ["__NEXT_DATA__", "__INITIAL_STATE__", "__PRELOADED_STATE__", "window.__", "__NUXT__", "digitalData", "dataLayer", "Shopify.theme", "ShopifyAnalytics", "algolia", "constructor.io", "searchspring", "bloomreach", "klevu", "products.json", "/api/", "graphql", "__remixContext", "self.__next_f"]) {
    const i = body.indexOf(key);
    if (i >= 0) console.log(`-- has ${key} @${i}: ${body.slice(Math.max(0, i - 80), i + 320).replace(/\s+/g, " ")}`);
  }
  const prices = [...body.matchAll(/"(?:price|salePrice|finalPrice|final_price|current_price|currentPrice|sellingPrice|offerPrice|priceValue)"\s*:\s*"?\d[\d.,]*/gi)].slice(0, 8);
  for (const p of prices) console.log(`-- price: ${body.slice(Math.max(0, p.index - 250), p.index + 120).replace(/\s+/g, " ")}`);
  const money = [...body.matchAll(/[$£]\s?\d{2,5}(?:\.\d\d)?/g)];
  const step = Math.max(1, Math.floor(money.length / 6));
  for (let i = 0; i < money.length && i < step * 6; i += step) console.log(`-- money ${i + 1}/${money.length}: ${body.slice(Math.max(0, money[i].index - 300), money[i].index + 60).replace(/\s+/g, " ")}`);
  const apis = new Set([...body.matchAll(/\/(?:[a-z-]+-app\/)?api\/[a-zA-Z0-9/_.-]{3,80}/g)].map((m) => m[0]).filter((a) => !/\/api\/(js|v\d\/js)\b/.test(a)));
  if (apis.size) console.log(`-- api paths: ${[...apis].slice(0, 40).join(" ")}`);
  const skus = [...body.matchAll(/"(?:sku|productCode|partNumber|product_code|itemCode)"\s*:\s*"[^"]{3,40}"/g)];
  if (skus.length) console.log(`-- sku keys (${skus.length}): ${skus.slice(0, 5).map((m) => body.slice(m.index, m.index + 260).replace(/\s+/g, " ")).join(" ## ")}`);
  const cards = [...body.matchAll(/class="[^"]*(?:product-(?:card|item|tile|grid-item|box)|productCard|ProductCard|product_item)[^"]*"/g)];
  if (cards.length) console.log(`-- product cards (${cards.length}): ${cards.slice(0, 2).map((m) => body.slice(m.index, m.index + 4500).replace(/\s+/g, " ")).join(" ## ")}`);
  for (const key of ["owProductPrice", '"hits":', '"products":[', 'pagination', 'data-page-count', 'page=2', '?p=2']) {
    const i = body.indexOf(key);
    if (i >= 0) console.log(`-- near ${key} @${i}: ${body.slice(Math.max(0, i - 200), i + 500).replace(/\s+/g, " ")}`);
  }
  const srcs = new Set([...body.matchAll(/<script[^>]+src="(\/[^"]+\.js[^"]*)"/gi)].map((m) => m[1]));
  if (srcs.size) console.log(`-- own scripts: ${[...srcs].slice(0, 12).join(" ")}`);
  const hosts = new Set([...body.matchAll(/<script[^>]+src="(https?:)?\/\/([^/"]+)/gi)].map((m) => m[2]));
  console.log(`-- script hosts: ${[...hosts].slice(0, 25).join(" ")}`);
  const links = new Set([...body.matchAll(/href="((?:https?:\/\/[^/"]+)?\/[a-z0-9\-/_.]{4,90}\/?)"/gi)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, "")));
  console.log(`-- links: ${[...links].slice(0, 40).join(" ")}`);
  const kwl = [...links].filter((u) => /tv|laptop|monitor|printer|tablet|headphone|router|speaker|phone|camera|drone|vacuum|coffee|fryer|watch|desktop|fridge|refrig|wash|dishwash|soundbar|console|gaming|applian|electr|kitchen|audio|lego|toy/i.test(u) && !/\.(css|js|png|jpg|woff2?|svg)$/.test(u));
  console.log(`-- keyword links (${kwl.length}): ${kwl.slice(0, 120).join(" ")}`);
}
