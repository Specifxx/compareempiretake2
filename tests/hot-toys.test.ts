// The hot toys page (lib/hot-toys.ts): hyped LEGO themes compared only at two or more stores in stock; indexed only with a set at
// three; every list toy sourced and dated; wired into the sitemap, IndexNow, the LEGO page and the routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HOT_LEGO_THEMES, HOT_TOYS_REGIONS, hotLego, hotToysFaq, hotToysIndexable, LIST_TOYS, SOURCES } from "../src/lib/hot-toys";
import type { PhoneSummary } from "../src/lib/catalog";

const s = (name: string, bestPrice: number, retailerCount: number, extra: Partial<PhoneSummary> = {}): PhoneSummary =>
  ({ slug: name, name, model: name, bestPrice, retailerCount, href: `/lego/${name}`, category: "lego", brand: "LEGO", inStock: true, ...extra }) as unknown as PhoneSummary;
const theme = (k: string) => HOT_LEGO_THEMES.find((t) => t.key === k)!;

test("each theme takes its own sets, in stock at two stores or more, most stores then cheapest", () => {
  const items = [
    s("LEGO KPop Demon Hunters Derpy Tiger and Sussie Bird 72537", 95, 9),
    s("LEGO K-Pop Demon Hunters Huntr/x Stage 72538", 150, 9),
    s("LEGO DUPLO Bluey's Family House 10459", 80, 7),
    s("LEGO Bluey Beach Trip 11203", 40, 1),
    s("LEGO Pokemon Pikachu 72152", 143, 9, { inStock: false }),
    s("LEGO City Fire Truck 60999", 30, 12),
  ];
  assert.deepEqual(hotLego(items, theme("kpop")).map((p) => p.bestPrice), [95, 150]);
  assert.deepEqual(hotLego(items, theme("bluey")).map((p) => p.bestPrice), [80]);
  assert.deepEqual(hotLego(items, theme("pokemon")), []);
});

test("indexable only with a hyped set in stock at three stores or more", () => {
  assert.equal(hotToysIndexable([s("LEGO Bluey House 10459", 1, 2)]), false);
  assert.equal(hotToysIndexable([s("LEGO City 60999", 1, 9)]), false);
  assert.equal(hotToysIndexable([s("LEGO Bluey House 10459", 1, 3)]), true);
});

test("every list toy is named by two lists or more, each sourced and dated", () => {
  for (const t of LIST_TOYS) assert.ok(t.lists.length >= 2, t.key);
  for (const src of Object.values(SOURCES)) { assert.match(src.url, /^https:\/\//); assert.match(src.date, /2026$/); }
  assert.equal(new Set(LIST_TOYS.map((t) => t.key)).size, LIST_TOYS.length);
});

test("the FAQ answers from the data only", () => {
  assert.match(hotToysFaq("Australia", s("LEGO Bluey 10459", 80, 7), (n) => `$${n}`)[1].a, /7 stores today, from \$80/);
  assert.match(hotToysFaq("Australia", undefined, String)[1].a, /None of the hyped LEGO sets/);
});

test("the page is in the sitemap, IndexNow, the LEGO page and the routes", () => {
  assert.deepEqual(HOT_TOYS_REGIONS, ["au", "us", "uk"]);
  assert.match(readFileSync("src/lib/seo.ts", "utf8"), /"\/hot-toys"/);
  assert.match(readFileSync("scripts/indexnow.ts", "utf8"), /hot-toys/);
  assert.match(readFileSync("src/views/CategoryView.tsx", "utf8"), /\/hot-toys/);
  for (const r of ["", "us/", "uk/"]) assert.match(readFileSync(`src/app/${r}hot-toys/page.tsx`, "utf8"), /HotToysView/);
});
