// The side rails and the phone dock (DECISIONS.md, 2026-11-06 "Side rails: eBay left, Amazon right, and the phone dock").
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DOCK_ARM, dockShows, type DockState } from "../src/components/AdDock";
import { dockHref, MIN_WIDTH } from "../src/components/SideRails";

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
      assert.match(t.href, new RegExp(`customid=ce-${r.region}-side-ebay-`));
      if (!t.price) assert.match(t.href, /\/sch\/i\.html\?_nkw=/, "a tile without a listing is an exact-name search");
    }
    if (r.region === "sg") assert.equal(r.amazon, null, "no Amazon programme in Singapore");
    for (const t of r.amazon?.tiles ?? []) {
      assert.equal(t.price, null, "never an Amazon price in a rail");
      assert.match(t.href, new RegExp(`[?&]tag=[a-z0-9-]+&ascsubtag=ce-${r.region}-side-amazon-`));
      assert.match(t.href, /\/dp\/[A-Z0-9]{10}\?|\/s\?k=/, "a specific product: its ASIN or its exact name");
    }
  }
});

test("rails: browser only, a static file per region, the page's column narrowed by CSS from 1280px", () => {
  const route = read("src/app/rails/[region]/route.ts");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /export const dynamicParams = false/);
  const c = read("src/components/SideRails.tsx");
  assert.match(c, /^"use client";/);
  assert.match(c, /fetch\(`\/rails\/\$\{region\}`\)/);
  assert.match(c, />Ad</);
  assert.equal(MIN_WIDTH, 1280);
  assert.match(read("src/app/globals.css"), /@media \(min-width: 1280px\) \{\s*main \.container-x,\s*footer \.container-x \{\s*max-width: min\(80rem, calc\(100vw - 320px\)\);/);
  assert.match(read("src/app/layout.tsx"), /<SideRails \/>/);
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
  assert.equal(dockHref("https://www.ebay.com/itm/1?customid=ce-us-side-ebay-tvs&x=1"), "https://www.ebay.com/itm/1?customid=ce-us-dock-ebay-tvs&x=1");
  const d = read("src/components/AdDock.tsx");
  assert.match(d, /return armed \? <>\{children\}<\/> : null;/);
  assert.match(d, /translate-y-full/);
  assert.doesNotMatch(d.replace(/^\/\/.*$/gm, ""), /amazon/i);
  assert.doesNotMatch(read("src/components/SideRails.tsx").split("export function dockHref")[1], /amazon/i, "no Amazon link in an overlay");
  assert.match(read("src/views/ProductView.tsx"), /data-no-dock/, "never on a product page");
});
