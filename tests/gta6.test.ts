// The GTA 6 hub (lib/gta6.ts): only PS5 and Xbox Series consoles, in stock, most stores first; every fact sourced to Rockstar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GTA6, GTA6_ACCESSORIES, GTA6_EDITIONS, GTA6_FAQ, GTA6_REGIONS, gta6ConsoleRows, gta6Consoles, gta6Track, gta6Tvs } from "../src/lib/gta6";
import type { PhoneSummary } from "../src/lib/catalog";

const c = (name: string, bestPrice: number, retailerCount: number, extra: Partial<PhoneSummary> = {}): PhoneSummary =>
  ({ slug: name, name, model: name, bestPrice, retailerCount, href: `/consoles/${name}`, category: "consoles", brand: "x", inStock: true, ...extra }) as unknown as PhoneSummary;

test("only PlayStation 5 and Xbox Series consoles, in stock, most stores then cheapest", () => {
  const out = gta6Consoles([
    c("Nintendo Switch 2 Console", 500, 9),
    c("MSI Claw 8 Handheld Gaming Console", 900, 4),
    c("Sony PlayStation 5 Slim Console", 600, 3),
    c("Microsoft Xbox Series X", 650, 5),
    c("Microsoft Xbox Series S", 400, 5),
    c("PS5 DualSense Controller", 100, 8),
    c("Sony PlayStation 5 Pro", 1000, 9, { inStock: false }),
  ]);
  assert.deepEqual(out.map((p) => p.name), ["Microsoft Xbox Series S", "Microsoft Xbox Series X", "Sony PlayStation 5 Slim Console"]);
});

test("the facts are Rockstar's, dated and checked; the hub exists in the regions that have consoles", () => {
  assert.equal(GTA6.releaseDate, "2026-11-19");
  assert.match(GTA6.source.url, /^https:\/\/www\.rockstargames\.com\/newswire\//);
  assert.deepEqual(GTA6_REGIONS, ["au", "us", "uk"]);
  assert.equal(new Set(GTA6_ACCESSORIES.map((a) => a.key)).size, GTA6_ACCESSORIES.length);
});

test("the hub is in the sitemap, IndexNow and the page routes", () => {
  const seo = readFileSync("src/lib/seo.ts", "utf8");
  assert.match(seo, /"\/gta-6"/);
  assert.match(readFileSync("scripts/indexnow.ts", "utf8"), /gta-6/);
  for (const r of ["", "us/", "uk/"]) assert.match(readFileSync(`src/app/${r}gta-6/page.tsx`, "utf8"), /Gta6View/);
});

test("after launch the hub says out now and gives both editions' list price in each region", () => {
  for (const r of GTA6_REGIONS) {
    const e = GTA6_EDITIONS[r as "au" | "us" | "uk"];
    assert.ok(e && e.standard && e.ultimate, r);
  }
  assert.match(readFileSync("src/views/Gta6View.tsx", "utf8"), /out now/);
  for (const r of ["", "us/", "uk/"]) assert.doesNotMatch(readFileSync(`src/app/${r}gta-6/page.tsx`, "utf8"), /launches 19 November/);
});

test("TVs: only 4K at 120Hz or more as the listing states, 2+ stores, in stock; no refresh rate means no row", () => {
  const tv = (name: string, facets: Record<string, string>, retailerCount = 3, extra: Partial<PhoneSummary> = {}) => c(name, 1000, retailerCount, { category: "tvs", facets, ...extra } as Partial<PhoneSummary>);
  const out = gta6Tvs([
    tv("A 4K 144Hz", { Resolution: "4K UHD", "Refresh rate": "144Hz" }, 5),
    tv("B 4K 120Hz", { Resolution: "4K UHD", "Refresh rate": "120Hz" }, 2),
    tv("C 4K 60Hz", { Resolution: "4K UHD", "Refresh rate": "60Hz" }),
    tv("D 4K no rate", { Resolution: "4K UHD" }),
    tv("E 8K 120Hz", { Resolution: "8K", "Refresh rate": "120Hz" }),
    tv("F one store", { Resolution: "4K UHD", "Refresh rate": "165Hz" }, 1),
    tv("G out of stock", { Resolution: "4K UHD", "Refresh rate": "165Hz" }, 4, { inStock: false }),
  ]);
  assert.deepEqual(out.map((p) => p.name), ["A 4K 144Hz", "B 4K 120Hz"]);
});

test("every console Rockstar names gets a row; the cheapest in-stock match wins, a Pro is never the plain PS5", () => {
  const rows = gta6ConsoleRows([
    c("Sony PS5 PlayStation 5 Pro Console", 1399, 1),
    c("Sony PlayStation 5 Slim Console", 999, 1),
    c("Sony PlayStation 5 Console", 899, 2),
    c("Sony PlayStation 5 Console Digital Edition", 919, 1),
    c("Microsoft Xbox Series X", 1099, 3),
    c("Microsoft Xbox Series X Digital Edition", 999, 1),
    c("Microsoft Xbox Series S", 699, 3, { inStock: false }),
    c("PS5 DualSense Controller", 99, 8),
  ]);
  assert.deepEqual(rows.map((r) => [r.model.key, r.product?.name]), [
    ["ps5", "Sony PlayStation 5 Console"],
    ["ps5-digital", "Sony PlayStation 5 Console Digital Edition"],
    ["ps5-pro", "Sony PS5 PlayStation 5 Pro Console"],
    ["series-x", "Microsoft Xbox Series X"],
    ["series-s", undefined],
  ]);
});

test("the hub states there is no PS6 and has FAQ structured data", () => {
  const faq = GTA6_FAQ("Australia", "au");
  assert.ok(faq.some((f) => /no PS6/i.test(f.a)));
  assert.match(readFileSync("src/views/Gta6View.tsx", "utf8"), /FAQPage/);
});

test("the /gta-6 preview names no single country: each region's cheapest console, a region with none left out", async () => {
  const { gta6WorldOgImage, GTA6_CONSOLE_MODELS } = await import("../src/lib/gta6");
  const s = (name: string, bestPrice: number) => ({ name, model: name, category: "consoles", inStock: true, bestPrice, retailerCount: 2 }) as never;
  const url = gta6WorldOgImage([
    { region: "us", rows: [{ model: GTA6_CONSOLE_MODELS[4], product: s("Xbox Series S", 499.99) }, { model: GTA6_CONSOLE_MODELS[0], product: s("PS5", 549.99) }] },
    { region: "uk", rows: [{ model: GTA6_CONSOLE_MODELS[0] }] },
  ]);
  const q = new URL(url, "https://x").searchParams;
  assert.equal(q.get("w"), "1");
  assert.equal(q.get("s"), "us~Xbox Series S~499.99");
});

test("the price tracker reads only our own history: blank where we have no day, lowest since the week before launch", () => {
  const t = gta6Track({ a: [["2026-11-10", 300], ["2026-11-12", 499], ["2026-11-19", 479], ["2026-11-20", 449]], b: [["2026-11-12", 520]] }, 469, "2026-11-22")!;
  assert.deepEqual(t, { weekBefore: 499, launch: 479, today: 469, low: 449, lowOn: "2026-11-20" });
  assert.equal(gta6Track({}, 400, "2026-11-22"), undefined);
  assert.equal(gta6Track({ a: [["2026-11-13", 500]] }, 400, "2026-11-22")!.weekBefore, undefined);
});
