// Prints what matters in each body the probe fetched (scripts/probe-stores.yml "urls" input), since the sandbox
// cannot download a run's artifacts: small text bodies (robots.txt, sitemaps, JSON) whole, and for HTML the JSON-LD
// blocks, embedded state objects, price-bearing snippets and script hosts. Read-only; nothing is written.
import { readdirSync, readFileSync } from "node:fs";
const dir = process.argv[2] || "/tmp/bodies";
const LIMIT = Number(process.env.PROBE_PRINT_LIMIT || 6000);
for (const f of readdirSync(dir).filter((f) => !f.endsWith(".headers")).sort()) {
  const body = readFileSync(`${dir}/${f}`, "utf8");
  let headers = "";
  try { headers = readFileSync(`${dir}/${f}.headers`, "utf8"); } catch {}
  console.log(`\n######## ${f} (${body.length} bytes)`);
  const ct = headers.match(/^content-type:.*$/im)?.[0] ?? "";
  const server = headers.match(/^(server|x-powered-by|x-shopify-stage|x-sorting-hat-shopid|x-cache|cf-ray|x-akamai[^:]*|x-magento[^:]*|x-bc[^:]*):.*$/gim)?.join(" | ") ?? "";
  console.log(`-- ${ct} ${server}`.trim());
  const isHtml = /<html|<!doctype html/i.test(body.slice(0, 2000));
  if (!isHtml || body.length < 4000) {
    console.log(body.slice(0, LIMIT));
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
  const money = [...body.matchAll(/[$£]\s?\d{2,5}(?:\.\d\d)?/g)].slice(0, 5);
  for (const m of money) console.log(`-- money: ${body.slice(Math.max(0, m.index - 300), m.index + 60).replace(/\s+/g, " ")}`);
  const hosts = new Set([...body.matchAll(/<script[^>]+src="(https?:)?\/\/([^/"]+)/gi)].map((m) => m[2]));
  console.log(`-- script hosts: ${[...hosts].slice(0, 25).join(" ")}`);
  const links = new Set([...body.matchAll(/href="(\/[a-z0-9\-/_.]{6,80})"/gi)].map((m) => m[1]));
  console.log(`-- links: ${[...links].slice(0, 60).join(" ")}`);
}
