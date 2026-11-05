// Thin pages out of the index (DECISIONS.md, 2026-11-05): which product pages are indexed and listed in the
// sitemap, each page's real lastmod, and the clean slug an entity-mangled URL redirects to.
import { test } from "node:test";
import assert from "node:assert/strict";
import { brandIndexable, cleanedSlug, latest, productIndexable, productInSitemap, productLastmod, productTitle, SITEMAP_MIN_STORES } from "../src/lib/indexing";
import { cleanTitle } from "../scripts/lib/http";
import type { Phone } from "../src/lib/types";

const offer = (retailer: string, price: number, inStock = true, kind: "outright" | "plan" = "outright") => ({ retailer, price, inStock, kind }) as Phone["variants"][number]["offers"][number];
const product = (offers: ReturnType<typeof offer>[]): Phone =>
  ({ slug: "x", category: "tvs", brand: "LG", model: "C5", name: "LG C5", firstSeen: "2026-10-20", retailerCount: new Set(offers.map((o) => o.retailer)).size, offerCount: offers.length, bestPrice: Math.min(...offers.map((o) => o.price)), variants: [{ id: "v", label: "", storageGb: 0, bestPrice: 1, offers }], images: [], colours: [], specs: {}, generation: 0 }) as unknown as Phone;

test("a product page is indexed only when two or more stores sell it and one has it in stock", () => {
  assert.equal(productIndexable(product([offer("a", 10)])), false, "one store");
  assert.equal(productIndexable(product([offer("a", 10, false), offer("b", 11, false)])), false, "all sold out");
  assert.equal(productIndexable(product([offer("a", 10, false), offer("b", 11, true, "plan")])), false, "a plan is not a price");
  assert.equal(productIndexable(product([offer("a", 10), offer("b", 11)])), true);
});

test("the sitemap lists the strongest tier only: three or more stores, in stock", () => {
  assert.equal(SITEMAP_MIN_STORES, 3);
  assert.equal(productInSitemap(product([offer("a", 10), offer("b", 11)])), false);
  assert.equal(productInSitemap(product([offer("a", 10), offer("b", 11), offer("c", 12)])), true);
  assert.equal(productInSitemap(product([offer("a", 10, false), offer("b", 11, false), offer("c", 12, false)])), false);
});

test("a brand page is indexed when one of its products is", () => {
  assert.equal(brandIndexable([product([offer("a", 10)]), product([offer("b", 10)])]), false);
  assert.equal(brandIndexable([product([offer("a", 10)]), product([offer("a", 10), offer("b", 12)])]), true);
});

test("lastmod is the last day a price moved, else the day the product was first seen; never the build time", () => {
  const p = product([offer("a", 10)]);
  const series = { v: [["2026-10-20", 999], ["2026-10-21", 999], ["2026-10-25", 949], ["2026-10-30", 949]] as [string, number][], w: [["2026-10-28", 1200]] as [string, number][] };
  assert.equal(productLastmod(p, series), "2026-10-25");
  assert.equal(productLastmod(p, { v: [["2026-10-20", 999], ["2026-10-21", 999]] }), "2026-10-20", "a flat series: first seen");
  assert.equal(productLastmod(p, {}), "2026-10-20");
  assert.equal(productLastmod({ firstSeen: "" }, {}), undefined, "nothing recorded: no lastmod at all");
  assert.equal(latest(["2026-10-25", undefined, "2026-11-01", "2026-10-30"]), "2026-11-01");
  assert.equal(latest([undefined]), undefined);
});

test("an entity-mangled slug maps to the clean slug the decoded title gives", () => {
  assert.equal(cleanedSlug("bowers-amp-wilkins-cwm7-3-reference-in-wall-speaker"), "bowers-wilkins-cwm7-3-reference-in-wall-speaker");
  assert.equal(cleanedSlug("weber-174-genesis-174-e-430-gas-grill"), "weber-genesis-e-430-gas-grill");
  assert.equal(cleanedSlug("jamo-s809-floor-standing-speaker-with-wiim-amp-ultra"), "jamo-s809-floor-standing-speaker-with-wiim-ultra", "a real 'amp' only redirects when the clean slug exists (the page checks)");
  assert.equal(cleanedSlug("apple-ipad-air-11-m4"), undefined);
  assert.equal(cleanedSlug("samsung-galaxy-tab-s9-ultra"), undefined);
});

test("store titles are decoded before they name a brand or mint a slug", () => {
  assert.equal(cleanTitle("Bowers &amp; Wilkins CWM7.3 Reference In Wall Speaker"), "Bowers & Wilkins CWM7.3 Reference In Wall Speaker");
  assert.equal(cleanTitle("Weber&#174 Genesis&#174 E-430 Gas Grill Stealth&#174 Edition [v::tx]"), "Weber Genesis E-430 Gas Grill Stealth Edition");
  assert.equal(cleanTitle("Breville&#8482; the Barista Express&#174; BES870"), "Breville the Barista Express BES870");
  assert.equal(cleanTitle("Sony WH-1000XM6 — Black"), "Sony WH-1000XM6 — Black", "a plain title is untouched");
});

test("product titles say the price, the store and the stores compared, within 70 characters", () => {
  const t = productTitle({ name: 'Apple iPad Air 11" (M4)', place: "Australia", price: "$987", store: "Harvey Norman", stores: 10 });
  assert.equal(t, 'Apple iPad Air 11" (M4) price in Australia: $987, 10 stores compared');
  assert.ok(t.length <= 70, t);
  assert.equal(productTitle({ name: "Google Pixel 11", place: "Australia", price: "$1,099", store: "JB Hi-Fi", stores: 6 }), "Google Pixel 11 price in Australia: $1,099, 6 stores compared", "the store form is 74 characters, so the next rung");
  assert.match(t, /\$987/);
  assert.match(t, /10 stores/);
  const one = productTitle({ name: "Google Pixel 11", place: "the UK", price: "£699", store: "Currys", stores: 1 });
  assert.equal(one, "Google Pixel 11 price in the UK: £699 at Currys");
  const long = productTitle({ name: "Samsung Galaxy Tab S9 Ultra 14.6 inch Wi-Fi Tablet 12GB 256GB Graphite", place: "the UK", price: "£899", store: "Argos", stores: 4 });
  assert.ok(long.length <= 70 || long.endsWith("price in the UK"), long);
});
