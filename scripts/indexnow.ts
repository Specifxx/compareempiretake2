/**
 * Tells Bing (and through it DuckDuckGo, Yahoo and ChatGPT search) which
 * pages changed today, via IndexNow (https://www.indexnow.org — free, no
 * account). The key file is public/<key>.txt, which proves we own the site.
 *
 * Sends the hub pages plus every product whose best price changed since the
 * previous history day. Run after the daily data commit.
 *
 * Only products in the three-store tier (productInIndexNow: 3+ stores, in stock) are
 * sent (2026-11-06, Vercel cost). IndexNow shares every URL with Bing, Yandex,
 * Seznam and Naver, and each engine fetched it minutes after the deploy, when
 * Vercel's CDN is empty: ~9,700 product renders a day, most of them one-store
 * pages that ask not to be indexed (2026-11-05 thin-pages rule) and so earn
 * nothing from being crawled.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { dataPath, REGION_IDS, withRegion } from "../src/lib/region";
import { GTA6_REGIONS } from "../src/lib/gta6";
import { productInIndexNow } from "../src/lib/indexing";
import type { Phone } from "../src/lib/types";

const HOST = "compareempire.com";
const key = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace(".txt", "");
if (!key) throw new Error("no IndexNow key file in public/");

const SEASON = ["/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year"];
const urls = new Set<string>(["/", "/deals", "/guides", ...GTA6_REGIONS.map((r) => withRegion("/gta-6", r)), ...SEASON, "/guides/black-friday-2026-real-tech-deals", ...CATEGORIES.filter((c) => c.live).flatMap((c) => [`/${c.id}`, `/deals/${c.id}`])]);
for (const region of REGION_IDS) for (const c of CATEGORIES.filter((x) => x.live)) {
  const dir = `${dataPath(region, c.id)}/history`;
  if (!existsSync(dir)) continue;
  if (region !== "au") ["/", "/deals", ...SEASON, `/${c.id}`].forEach((u) => urls.add(withRegion(u, region)));
  const days = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const load = (f?: string) => (f ? (JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as Record<string, Record<string, Record<string, number>>>) : undefined);
  const today = load(days.at(-1));
  const prev = load(days.at(-2));
  if (!today) continue;
  const catalogFile = `${dataPath(region, c.id)}/catalog.json`;
  const products = existsSync(catalogFile) ? (JSON.parse(readFileSync(catalogFile, "utf8")) as { phones: Phone[] }).phones : [];
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const best = (v?: Record<string, number>) => (v ? Math.min(...Object.values(v)) : undefined);
  for (const [slug, variants] of Object.entries(today)) {
    const changed = !prev?.[slug] || Object.entries(variants).some(([vid, p]) => best(p) !== best(prev[slug]?.[vid]));
    const p = changed ? bySlug.get(slug) : undefined;
    if (p && productInIndexNow(p)) urls.add(withRegion(`/${c.id}/${slug}`, region));
  }
}

const list = [...urls].slice(0, 10_000).map((u) => `https://${HOST}${u}`);
async function main() {
  if (process.argv.includes("--dry")) return console.log(`IndexNow (dry run): ${list.length} URLs, e.g. ${list.slice(0, 3).join(" ")}`);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: list }),
});
console.log(`IndexNow: submitted ${list.length} URLs → HTTP ${res.status}`);
if (res.status >= 400 && res.status !== 429) process.exitCode = 1;
}
main();
