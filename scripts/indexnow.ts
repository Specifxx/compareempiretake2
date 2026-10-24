/**
 * Tells Bing (and through it DuckDuckGo, Yahoo and ChatGPT search) which
 * pages changed today, via IndexNow (https://www.indexnow.org — free, no
 * account). The key file is public/<key>.txt, which proves we own the site.
 *
 * Sends the hub pages plus every product whose best price changed since the
 * previous history day. Run after the daily data commit.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { dataPath, REGION_IDS, withRegion } from "../src/lib/region";

const HOST = "www.compareempire.com";
const key = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace(".txt", "");
if (!key) throw new Error("no IndexNow key file in public/");

const urls = new Set<string>(["/", "/deals", "/guides", ...CATEGORIES.flatMap((c) => [`/${c.id}`, `/deals/${c.id}`])]);
for (const region of REGION_IDS) for (const c of CATEGORIES) {
  const dir = `${dataPath(region, c.id)}/history`;
  if (!existsSync(dir)) continue;
  if (region !== "au") ["/", "/deals", `/${c.id}`].forEach((u) => urls.add(withRegion(u, region)));
  const days = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const load = (f?: string) => (f ? (JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as Record<string, Record<string, Record<string, number>>>) : undefined);
  const today = load(days.at(-1));
  const prev = load(days.at(-2));
  if (!today) continue;
  const best = (v?: Record<string, number>) => (v ? Math.min(...Object.values(v)) : undefined);
  for (const [slug, variants] of Object.entries(today)) {
    const changed = !prev?.[slug] || Object.entries(variants).some(([vid, p]) => best(p) !== best(prev[slug]?.[vid]));
    if (changed) urls.add(withRegion(`/${c.id}/${slug}`, region));
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
