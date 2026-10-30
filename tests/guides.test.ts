import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { blockArgs, cheapestBy, parseCats, PRICE_TWINS, storeWins, topOptions, topProducts } from "../src/lib/guide-data";
import type { Phone } from "../src/lib/types";

const DIR = path.join(process.cwd(), "content/guides");
const files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
const guides = files.map((f) => {
  const raw = readFileSync(path.join(DIR, f), "utf8");
  const [, head, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const meta = Object.fromEntries((head ?? "").split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim().replace(/^"(.*)"$/, "$1")]));
  return { slug: f.replace(/\.md$/, ""), meta, body: body ?? "" };
});

test("every guide has front matter, a known section and its own title", () => {
  const sections = ["best", "opinion", "compare", "stores", "how-to", "save"];
  for (const g of guides) {
    for (const k of ["title", "description", "date", "section"]) assert.ok(g.meta[k], `${g.slug}: missing ${k}`);
    assert.ok(sections.includes(g.meta.section), `${g.slug}: section ${g.meta.section}`);
    assert.ok(g.meta.description.length <= 200, `${g.slug}: description is ${g.meta.description.length} characters`);
  }
  const titles = guides.map((g) => g.meta.title.toLowerCase());
  assert.equal(new Set(titles).size, titles.length, "two guides share a title");
});

test("links between guides land on a guide", () => {
  const slugs = new Set(guides.map((g) => g.slug));
  for (const g of guides) for (const m of g.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)/g)) assert.ok(slugs.has(m[1]), `${g.slug} links to /guides/${m[1]}, which doesn't exist`);
});

test("block arguments parse, and repeated spec filters collect", () => {
  const o = topOptions('cat=tvs+soundbars,spec=Screen size:65",spec=Panel:OLED,max=2000,sort=price,n=5');
  assert.deepEqual(o.cats, ["tvs", "soundbars"]);
  assert.deepEqual(o.spec, ['Screen size:65"', "Panel:OLED"]);
  assert.equal(o.max, 2000);
  assert.equal(o.sort, "price");
  assert.equal(topOptions("cat=nope,sort=valueOf").sort, undefined);
  assert.deepEqual(parseCats("nope+tvs"), ["tvs"]);
  assert.deepEqual(blockArgs("only=apple+samsung,min=8"), { only: ["apple+samsung"], min: ["8"] });
});

const offer = (retailer: string, price: number, inStock = true) => ({ retailer, sku: retailer, title: "", url: "", price, colour: "", inStock }) as Phone["variants"][number]["offers"][number];
const product = (slug: string, offers: ReturnType<typeof offer>[], extra: [string, string][] = [], over: Partial<Phone> = {}): Phone =>
  ({ slug, category: "tvs", brand: "B", model: slug, name: slug, images: [], colours: [], variants: [{ id: "std", label: "", storageGb: 0, offers, bestPrice: Math.min(...offers.map((o) => o.price)) }], bestPrice: Math.min(...offers.map((o) => o.price)), retailerCount: new Set(offers.map((o) => o.retailer)).size, offerCount: offers.length, specs: { extra }, generation: 0, firstSeen: "", ...over }) as Phone;

test("storeWins counts ties for every cheapest store and treats price twins as one store", () => {
  const ps = [
    product("a", [offer("jbhifi", 100), offer("harveynorman", 100), offer("thegoodguys", 120)]),
    product("b", [offer("jbhifi", 200), offer("thegoodguys", 180)]),
    product("c", [offer("msy", 50), offer("umart", 50), offer("jbhifi", 60)]),
    product("d", [offer("msy", 50), offer("umart", 50)]),
    product("e", [offer("jbhifi", 10), offer("thegoodguys", 5, false)]),
  ];
  assert.equal(PRICE_TWINS.umart, "msy");
  const w = Object.fromEntries(storeWins(ps, { minCompared: 1 }).map((x) => [x.retailer, x]));
  assert.deepEqual([w.jbhifi.compared, w.jbhifi.wins], [3, 1]);
  assert.deepEqual([w.thegoodguys.compared, w.thegoodguys.wins], [2, 1]);
  assert.deepEqual([w.msy.compared, w.msy.wins], [1, 1], "MSY and Umart alone are not a head-to-head");
  assert.equal(w.umart, undefined);
  assert.equal(Math.round(w.thegoodguys.medianGap), 20);
});

test("topProducts filters by spec (contains, or = for exact) and keeps one row per model", () => {
  const ps = [
    product("rtx-5070-a", [offer("msy", 900), offer("ple", 950)], [["GPU", "RTX 5070"]]),
    product("rtx-5070-ti", [offer("msy", 1300), offer("ple", 1350)], [["GPU", "RTX 5070 Ti"]]),
    product("rtx-5070-b", [offer("msy", 800), offer("ple", 820)], [["GPU", "RTX 5070"]], { model: "rtx-5070-a" }),
  ].map((p) => ({ ...p, category: "graphics-cards" as const }));
  assert.equal(topProducts(ps, topOptions("cat=graphics-cards,spec=GPU:RTX 5070")).length, 2);
  const exact = topProducts(ps, topOptions("cat=graphics-cards,spec=GPU:=RTX 5070,sort=price"));
  assert.deepEqual(exact.map((p) => p.slug), ["rtx-5070-b"]);
  assert.deepEqual(topProducts(ps, topOptions("cat=graphics-cards,q=(")), [], "a bad pattern renders nothing, not a crash");
  const by = cheapestBy(ps, { cats: ["graphics-cards"], spec: "GPU", values: ["RTX 5070 Ti", "RTX 5070"] });
  assert.deepEqual(by.map((r) => [r.value, r.cheapest.slug, r.models]), [["RTX 5070 Ti", "rtx-5070-ti", 1], ["RTX 5070", "rtx-5070-b", 2]]);
});
