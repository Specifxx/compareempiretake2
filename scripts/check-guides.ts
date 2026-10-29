/**
 * Warns about guide blocks that render nothing with today's data: a [[top]] or [[by]] whose filters
 * match no product, a [[phone]]/[[compare]]/{{price}} naming a slug no store sells any more. GuideBody
 * drops those quietly, so a guide can thin out without anyone noticing. Warn-only (prices move
 * daily); run it after writing or editing a guide.
 *
 * Usage: npx tsx scripts/check-guides.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { blockArgs, cheapestBy, parseCats, planVsOutright, storeWins, topOptions, topProducts } from "../src/lib/guide-data";
import type { Phone } from "../src/lib/types";

const root = process.cwd();
const all: Phone[] = [];
for (const c of parseCats("all")) {
  const f = path.join(root, "data", c, "catalog.json");
  if (existsSync(f)) all.push(...(JSON.parse(readFileSync(f, "utf8")).phones as Phone[]).map((p) => ({ ...p, category: c })));
}
const bySlug = new Map(all.map((p) => [`${p.category}/${p.slug}`, p]));
const find = (ref: string) => bySlug.get(ref.includes("/") ? ref : `phones/${ref}`);

let problems = 0;
const dir = path.join(root, "content/guides");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  const body = readFileSync(path.join(dir, file), "utf8");
  const warn = (msg: string) => {
    problems++;
    console.log(`${file}: ${msg}`);
  };
  for (const m of body.matchAll(/\{\{(price|stores|name|link):([a-z0-9/-]+)(?::[a-z0-9]+)?\}\}/g)) if (!find(m[2])) warn(`{{${m[1]}:${m[2]}}} matches no product`);
  for (const m of body.matchAll(/^\[\[(\w+):([^\]]+)\]\]\s*$/gm)) {
    const [, kind, arg] = m;
    if (kind === "phone" && !find(arg.split("|")[0].trim())) warn(`[[phone:${arg.split("|")[0]}]] matches no product`);
    if (kind === "build") for (const s of arg.split(",")) if (!find(s.split("|")[0].trim())) warn(`[[build]] ${s.split("|")[0].trim()} matches no product`);
    if (kind === "compare") for (const s of arg.split(",")) if (!find(s.trim())) warn(`[[compare]] ${s.trim()} matches no product`);
    if (kind === "top") {
      const n = topProducts(all, topOptions(arg)).length;
      if (n < 3) warn(`[[top:${arg}]] has ${n} rows`);
    }
    if (kind === "by") {
      const a = blockArgs(arg);
      const cats = parseCats(a.cat?.[0]);
      const rows = cheapestBy(all, { cats, spec: a.spec?.[0] ?? "", values: a.values?.[0]?.split("+").map((v) => v.trim()), stores: a.stores ? Number(a.stores[0]) : undefined, max: a.max ? Number(a.max[0]) : undefined });
      if (rows.length < 2) warn(`[[by:${arg}]] has ${rows.length} rows`);
    }
    if (kind === "plans" && planVsOutright(all.filter((p) => p.category === "phones")).length < 3) warn("[[plans]] has under 3 rows");
    if (kind === "stores") {
      const a = blockArgs(arg);
      const cats = parseCats(a.cat?.[0]);
      const rows = storeWins(all.filter((p) => cats.includes(p.category)), { only: a.only?.[0]?.split("+") as never, minCompared: Number(a.min?.[0] ?? 10) });
      if (rows.length < 2) warn(`[[stores:${arg}]] has ${rows.length} rows`);
    }
    if (kind === "list") {
      const o = Object.fromEntries(arg.split(",").map((kv) => kv.split("=").map((s) => s.trim())));
      const n = all.filter((p) => p.category === (o.cat ?? "phones") && (!o.max || p.bestPrice <= Number(o.max)) && (!o.min || p.bestPrice >= Number(o.min)) && (!o.brand || p.brand.toLowerCase() === o.brand.toLowerCase()) && p.retailerCount >= Number(o.stores ?? 2) && p.image).length;
      if (n < 4) warn(`[[list:${arg}]] has ${n} products`);
    }
  }
}
console.log(problems ? `${problems} block(s) to look at` : "Every guide block has data today.");
