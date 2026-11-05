// Store pre-orders found automatically (lib/preorders.ts, lib/launches.ts storePreorders): a store's own availability or
// title says pre-order; the product then reaches /launches and the home row with no entry in content/launches.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { offerIsPreorder, offerStatus, preorderStoreCount, PREORDER_TITLE } from "../src/lib/preorders";
import { storePreorders } from "../src/lib/launches";
import type { PhoneSummary } from "../src/lib/catalog";

test("a listing is a pre-order by its availability or its title, never by 'pre-owned'", () => {
  for (const t of ["Samsung Galaxy S27 Ultra 256GB (Pre-Order)", "Pre-order - Apple iPhone Duo 512GB, ships 23 October", "PREORDER Nothing Phone (4)", "Sony A7 V Body - Coming Soon"]) {
    assert.ok(PREORDER_TITLE.test(t), t);
    assert.ok(offerIsPreorder({ title: t }), t);
  }
  for (const t of ["Apple iPhone 17 Pro 256GB (Pre-Owned)", "Prepaid SIM Starter Kit", "LG C5 65\" OLED TV"]) {
    assert.equal(offerIsPreorder({ title: t }), false, t);
  }
  assert.equal(offerIsPreorder({ title: "Galaxy Z Fold8", preorder: true }), true, "JB Hi-Fi's PreOrder tag, a feed's availability");
});

test("the store count and the row label", () => {
  const o = (retailer: string, preorder?: boolean, inStock = false) => ({ retailer, preorder, inStock }) as never;
  assert.equal(preorderStoreCount({ variants: [{ offers: [o("jbhifi", true), o("jbhifi", true), o("officeworks"), o("harveynorman", true)] }] } as never), 2);
  assert.equal(preorderStoreCount({ variants: [{ offers: [o("jbhifi", undefined, true)] }] } as never), 0);
  assert.equal(offerStatus({ inStock: false, preorder: true }), "pre-order");
  assert.equal(offerStatus({ inStock: true, preorder: true }), "in-stock");
  assert.equal(offerStatus({ inStock: false }), "out");
});

test("storePreorders: most stores first, a hand-kept launch's product is not repeated, in-stock products are left out", () => {
  const p = (slug: string, name: string, preorderStores: number, retailerCount: number, bestPrice: number): PhoneSummary =>
    ({ slug, name, preorderStores, retailerCount, bestPrice, href: `/phones/${slug}`, category: "phones", brand: "x", image: "i", inStock: preorderStores === 0 }) as unknown as PhoneSummary;
  const all = [
    p("apple-iphone-duo", "Apple iPhone Duo", 3, 5, 3497), // shown by the hand-kept launch on 2026-11-03
    p("samsung-galaxy-s27", "Samsung Galaxy S27", 2, 4, 1499),
    p("nothing-phone-4", "Nothing Phone (4)", 2, 2, 999),
    p("google-pixel-11", "Google Pixel 11", 1, 6, 1299),
    p("apple-iphone-17", "Apple iPhone 17", 0, 9, 1399),
  ];
  const rows = storePreorders("au", "2026-11-03", () => all);
  assert.deepEqual(rows.map((r) => [r.product.slug, r.stores]), [["samsung-galaxy-s27", 2], ["nothing-phone-4", 2], ["google-pixel-11", 1]]);
  assert.deepEqual(storePreorders("au", "2027-06-01", () => all).map((r) => r.product.slug)[0], "apple-iphone-duo", "once the hand launch retires the store row shows it");
});

test("the offers build carries the flag, the scrapers set it, and the product row says Pre-order", () => {
  assert.match(readFileSync("scripts/build-catalog.ts", "utf8"), /preorder: offerIsPreorder\(o\)/);
  assert.match(readFileSync("scripts/scrapers/jbhifi.ts", "utf8"), /preorder: \/PreOrder\/i\.test\(tags\)/);
  assert.match(readFileSync("scripts/scrapers/feed.ts", "utf8"), /preorder: \/pre-\?order\/i\.test/);
  assert.match(readFileSync("src/components/PhoneOffers.tsx", "utf8"), /o\.preorder \? "Pre-order"/);
  assert.match(readFileSync("src/views/LaunchesView.tsx", "utf8"), /storePreorders\(/);
  assert.match(readFileSync("src/views/HomeView.tsx", "utf8"), /storePreorders\(/);
});
