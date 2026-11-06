import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { awinDeepLink, awinProgrammeFor, awinUrl, bareHost, clickref, AWIN_PUBLISHER_ID } from "../src/lib/awin";
import { toProgramme } from "../scripts/awin-sync";
import { headerMap } from "../scripts/scrapers/feed";

const JOINED = [
  { id: 1599, name: "Currys", domains: ["currys.co.uk"] },
  { id: 2042, name: "Box.co.uk", domains: ["box.co.uk"] },
];

test("a joined advertiser's store link becomes a tracked Awin deep link to the same page", () => {
  const url = "https://www.currys.co.uk/products/apple-iphone-17-256gb-10279.html";
  const out = awinUrl(url, "ce-row", JOINED)!;
  const u = new URL(out);
  assert.equal(u.hostname, "www.awin1.com");
  assert.equal(u.searchParams.get("awinmid"), "1599");
  assert.equal(u.searchParams.get("awinaffid"), String(AWIN_PUBLISHER_ID));
  assert.equal(u.searchParams.get("clickref"), "ce-row");
  assert.equal(u.searchParams.get("ued"), url);
});

test("stores we have not joined, look-alike hosts, eBay and Amazon are left alone", () => {
  assert.equal(awinUrl("https://www.jbhifi.com.au/products/x", "ce", JOINED), null);
  assert.equal(awinUrl("https://notcurrys.co.uk/x", "ce", JOINED), null);
  assert.equal(awinUrl("https://currys.co.uk.evil.example/x", "ce", JOINED), null);
  assert.equal(awinProgrammeFor("https://www.ebay.co.uk/itm/1", [{ id: 9, name: "x", domains: ["ebay.co.uk"] }]), null);
  assert.equal(awinProgrammeFor("https://www.amazon.co.uk/dp/B0", [{ id: 9, name: "x", domains: ["amazon.co.uk"] }]), null);
  assert.equal(awinUrl("not a url", "ce", JOINED), null);
});

test("a subdomain of a tracked domain matches", () => {
  assert.equal(awinProgrammeFor("https://shop.box.co.uk/p/1", JOINED)?.id, 2042);
});

test("a feed's own Awin link keeps its tracking and gains our clickref once", () => {
  const feed = "https://www.awin1.com/pclick.php?p=123&a=3144410&m=1599";
  assert.equal(new URL(awinUrl(feed, "ce-row", JOINED)!).searchParams.get("clickref"), "ce-row");
  const mine = awinDeepLink(1599, "https://www.currys.co.uk/", "first");
  assert.equal(new URL(awinUrl(mine, "second", JOINED)!).searchParams.get("clickref"), "first");
});

test("clickref is Awin-safe", () => {
  assert.equal(clickref("ce", "UK row", "Apple iPhone 17!"), "ce-uk-row-apple-iphone-17-");
  assert.ok(clickref("x".repeat(80)).length <= 50);
});

test("bareHost normalises Awin's domain spellings", () => {
  assert.equal(bareHost("https://www.Currys.co.uk/path"), "currys.co.uk");
  assert.equal(bareHost("*.argos.co.uk"), "argos.co.uk");
  assert.equal(bareHost("ao.com"), "ao.com");
});

test("toProgramme keeps id, name, domains, region and currency only", () => {
  const p = toProgramme({ id: 1599, name: " Currys ", displayUrl: "https://www.currys.co.uk", validDomains: [{ domain: "currys.co.uk" }, { domain: "*.currys.ie" }], primaryRegion: { countryCode: "GB" }, currencyCode: "GBP", status: "active" });
  assert.deepEqual(p, { id: 1599, name: "Currys", domains: ["currys.co.uk", "currys.ie"], region: "GB", currency: "GBP" });
  assert.equal(toProgramme({ id: 1, name: "No domain" }), null);
  assert.equal(toProgramme({ name: "No id", displayUrl: "x.com" }), null);
});

test("the committed programmes file holds only public fields", () => {
  const f = JSON.parse(readFileSync("data/awin/programmes.json", "utf8"));
  assert.equal(f.publisherId, AWIN_PUBLISHER_ID);
  assert.ok(Array.isArray(f.joined));
  for (const p of f.joined) for (const k of Object.keys(p)) assert.ok(["id", "name", "domains", "region", "currency"].includes(k), k);
  assert.doesNotMatch(readFileSync("data/awin/programmes.json", "utf8"), /token|accessToken|Bearer/i);
});

test("an Awin feed's tracked link wins over merchant_deep_link whatever the column order", () => {
  const m = headerMap(["merchant_deep_link", "product_name", "store_price", "search_price", "aw_deep_link"]);
  const byField = Object.fromEntries([...m].map(([col, f]) => [f, col]));
  assert.equal(byField.link, 4);
  assert.equal(byField.price, 3);
  assert.equal(byField.title, 1);
});

test("every store row link goes through storeLink", () => {
  for (const f of ["src/components/PhoneOffers.tsx", "src/components/CompareView.tsx", "src/views/StoresView.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /storeLink\(/, f);
    assert.doesNotMatch(src, /href=\{o\.url\}/, f);
  }
});

test("the daily workflow runs the Awin sync with its secret", () => {
  const wf = readFileSync(".github/workflows/refresh-prices.yml", "utf8");
  assert.match(wf, /AWIN_API_TOKEN: \$\{\{ secrets\.AWIN_API_TOKEN \}\}\n\s+run: npx tsx scripts\/awin-sync\.ts/);
});
