// The one in-page ad block and the phone dock (DECISIONS.md, 2026-11-13 "the side rails are replaced by one native horizontal block").
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { DOCK_ARM, dockShows, type DockState } from "../src/components/AdDock";
import { dockHref, MIN_WIDTH } from "../src/components/PhoneDock";
import { blockTiles, BLOCK_TILES, rowTiles, ROW_TILES } from "../src/components/InlineAds";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("rails: eBay tiles are live listings or exact-name searches; Amazon tiles are tagged links with no price", () => {
  // lib/catalog.ts imports "server-only": read it under the react-server condition, as tests/client-data.test.ts does.
  const code = `import { railsFor } from "./src/lib/side-rails.ts"; console.log(JSON.stringify(["au","us","uk","ca","sg"].map(railsFor)));`;
  const all = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 << 20 }).trim().split("\n").pop()!);
  for (const r of all) {
    assert.ok(r.ebay.tiles.length <= 10);
    for (const t of r.ebay.tiles) {
      assert.ok(t.img, `${r.region}: a photo`);
      assert.match(t.href, /campid=5339155912/);
      assert.match(t.href, new RegExp(`customid=ce-${r.region}-inline-ebay-`));
      if (!t.price) assert.match(t.href, /\/sch\/i\.html\?_nkw=/, "a tile without a listing is an exact-name search");
    }
    if (r.region === "sg") assert.equal(r.amazon, null, "no Amazon programme in Singapore");
    for (const t of r.amazon?.tiles ?? []) {
      assert.equal(t.price, null, "never an Amazon price in a rail");
      assert.match(t.href, new RegExp(`[?&]tag=[a-z0-9-]+&ascsubtag=ce-${r.region}-inline-amazon-`));
      assert.match(t.href, /\/dp\/[A-Z0-9]{10}\?|\/s\?k=/, "a specific product: its ASIN or its exact name");
    }
  }
});

test("block: six tiles, eBay first then Amazon, Amazon never priced", () => {
  const t = (id: string, price: string | null) => ({ id, name: id, img: "x", price, href: "h" });
  const ebay = { label: "ebay.com", more: "m", tiles: ["a", "b", "c", "d", "e", "f", "g"].map((i) => t(i, "$1")) };
  const withAmazon = blockTiles({ ebay, amazon: { label: "Amazon", tiles: ["x", "y", "z"].map((i) => t(i, null)) } });
  assert.equal(withAmazon.length, BLOCK_TILES);
  assert.deepEqual(withAmazon.map((b) => b.source), ["ebay", "ebay", "ebay", "ebay", "amazon", "amazon"]);
  assert.ok(withAmazon.filter((b) => b.source === "amazon").every((b) => b.price === null));
  const noAmazon = blockTiles({ ebay, amazon: null });
  assert.equal(noAmazon.length, BLOCK_TILES);
  assert.ok(noAmazon.every((b) => b.source === "ebay"));
});

test("block: in the page, browser only, native, one per page, no side rails left", () => {
  const route = read("src/app/rails/[region]/route.ts");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /export const dynamicParams = false/);
  const c = read("src/components/InlineAds.tsx");
  assert.match(c, /^"use client";/);
  assert.match(read("src/components/useAdFeed.ts"), /fetch\(`\/rails\/\$\{region\}`\)/);
  assert.match(c, />Ad</);
  assert.match(c, /rel=\{SPONSORED_REL\}/);
  assert.match(c, /min-h-\[/, "height reserved: CLS 0");
  assert.doesNotMatch(c.replace(/^\/\/.*$/gm, ""), /fixed|sticky|absolute inset-x|z-\d/, "nothing floating");
  assert.equal(MIN_WIDTH, 1280);
  assert.ok(!existsSync(new URL("../src/components/SideRails.tsx", import.meta.url)), "the side rails are gone");
  assert.ok(!existsSync(new URL("../src/components/EbayStrip.tsx", import.meta.url)), "one block, not a strip too");
  assert.ok(!existsSync(new URL("../src/components/AmazonPicks.tsx", import.meta.url)), "one block, not an Amazon grid too");
  assert.doesNotMatch(read("src/app/globals.css"), /calc\(100vw - 320px\)/, "the column keeps its whole width");
  assert.match(read("src/app/layout.tsx"), /<PhoneDock \/>/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /<InlineAds/, "never in the layout: each page places its one block");
  // Mid-page, not at the foot (owner, 2026-11-27): the home page's eBay row after the price drops and its Amazon row after the
  // launches; a product page's rows under "Similar price range", above the specs; a category's eBay row inside the grid.
  const home = read("src/views/HomeView.tsx");
  assert.equal((home.match(/<InlineAds only="ebay"/g) ?? []).length, 1, "home: one eBay row");
  assert.equal((home.match(/<InlineAds only="amazon"/g) ?? []).length, 1, "home: one Amazon row");
  assert.ok(home.indexOf('<InlineAds only="ebay"') > home.indexOf("Price drops today") && home.indexOf('<InlineAds only="ebay"') < home.indexOf("Most compared phones"), "home: eBay after the drops");
  assert.ok(home.indexOf('<InlineAds only="amazon"') > home.indexOf("<HotLaunches") && home.indexOf('<InlineAds only="amazon"') < home.indexOf("home-cat-shelf"), "home: Amazon after the launches");
  const pv = read("src/views/ProductView.tsx");
  assert.equal((pv.match(/<InlineAds /g) ?? []).length, 1, "product: one block");
  assert.ok(pv.indexOf("<InlineAds ") > pv.indexOf("Similar price range") && pv.indexOf("<InlineAds ") < pv.indexOf("Key specs"), "product: under the similar products, above the specs");
  const cv = read("src/views/CategoryView.tsx");
  assert.match(cv, /midAd=\{<InlineAds only="ebay"/);
  assert.equal((cv.match(/<InlineAds only="amazon"/g) ?? []).length, 1);
  assert.equal((read("src/app/deals/page.tsx").match(/<InlineAds \/>/g) ?? []).length, 1, "deals: one block");
  assert.doesNotMatch(read("src/components/QuickView.tsx"), /InlineAds/, "never in the quick view");
  assert.ok(pv.indexOf("<InlineAds ") > pv.indexOf("<ReportPrice"), "never beside the buy buttons: after the price table");
});

test("rows: one partner each, at most ten, Amazon never priced, nothing under two", () => {
  const t = (id: string, price: string | null) => ({ id, name: id, img: "x", price, href: "h" });
  const ebay = { label: "ebay.com", more: "m", tiles: Array.from({ length: 12 }, (_, i) => t(`e${i}`, "$1")) };
  const amazon = { label: "Amazon", tiles: Array.from({ length: 12 }, (_, i) => t(`a${i}`, null)) };
  assert.equal(rowTiles({ ebay, amazon }, "ebay").length, ROW_TILES);
  assert.ok(rowTiles({ ebay, amazon }, "ebay").every((x) => x.source === "ebay"));
  assert.ok(rowTiles({ ebay, amazon }, "amazon").every((x) => x.source === "amazon" && x.price === null));
  assert.deepEqual(rowTiles({ ebay, amazon: null }, "amazon"), []);
  assert.deepEqual(rowTiles({ ebay: { ...ebay, tiles: [t("x", "$1")] }, amazon }, "ebay"), []);
});

test("the phone dock: narrow screens only, after a scroll, never beside another unit, a product page or a dialog; never Amazon", () => {
  const ok: DockState = { narrow: true, scrolled: 1000, screen: 800, blockers: 0, buybar: false, modal: false, typing: false, dismissed: false };
  assert.ok(dockShows(ok));
  assert.ok(!dockShows({ ...ok, narrow: false }));
  assert.ok(!dockShows({ ...ok, scrolled: 800 * DOCK_ARM - 1 }));
  assert.ok(!dockShows({ ...ok, blockers: 1 }));
  assert.ok(!dockShows({ ...ok, buybar: true }));
  assert.ok(!dockShows({ ...ok, modal: true }));
  assert.ok(!dockShows({ ...ok, typing: true }));
  assert.ok(!dockShows({ ...ok, dismissed: true }));
  assert.equal(dockHref("https://www.ebay.com/itm/1?customid=ce-us-inline-ebay-tvs&x=1"), "https://www.ebay.com/itm/1?customid=ce-us-dock-ebay-tvs&x=1");
  const d = read("src/components/AdDock.tsx");
  assert.match(d, /return armed \? <>\{children\}<\/> : null;/);
  assert.match(d, /translate-y-full/);
  assert.doesNotMatch(d.replace(/^\/\/.*$/gm, ""), /amazon/i);
  assert.doesNotMatch(read("src/components/PhoneDock.tsx").replace(/^\/\/.*$/gm, ""), /amazon/i, "no Amazon link in an overlay");
  assert.match(read("src/views/ProductView.tsx"), /data-no-dock/, "never on a product page");
});
