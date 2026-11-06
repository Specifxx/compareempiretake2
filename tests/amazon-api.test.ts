import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { credentialsFor, isWrongAccount, itemsOf, pickListing, tokenEndpoint, type Item } from "../src/lib/amazon-creators";
import { isFreshAmazonPrice } from "../src/lib/amazon";
import { amazonTitleMatches } from "../src/lib/listing-parse";
import type { Phone } from "../src/lib/types";

test("token endpoint follows the credential version, AU defaults to FE (3.3)", () => {
  assert.equal(tokenEndpoint("3.1", "au"), "https://api.amazon.com/auth/o2/token");
  assert.equal(tokenEndpoint("3.2", "au"), "https://api.amazon.co.uk/auth/o2/token");
  assert.equal(tokenEndpoint(undefined, "au"), "https://api.amazon.co.jp/auth/o2/token");
  assert.equal(tokenEndpoint("2.9", "us"), "https://api.amazon.com/auth/o2/token");
});

test("no credentials, no client; version defaults per market", () => {
  assert.equal(credentialsFor("au", {}), null);
  assert.equal(credentialsFor("au", { AMAZON_CREATORS_AU_CLIENT_ID: "x" }), null);
  assert.deepEqual(credentialsFor("au", { AMAZON_CREATORS_AU_CLIENT_ID: " a ", AMAZON_CREATORS_AU_CLIENT_SECRET: "b" }), { id: "a", secret: "b", version: "3.3" });
  assert.equal(credentialsFor("au", { AMAZON_CREATORS_AU_CLIENT_ID: "a", AMAZON_CREATORS_AU_CLIENT_SECRET: "b", AMAZON_CREATORS_AU_VERSION: "3.1" })!.version, "3.1");
});

test("the AU variables are the US and UK fallback, a market's own credential wins", () => {
  const au = { AMAZON_CREATORS_AU_CLIENT_ID: "a", AMAZON_CREATORS_AU_CLIENT_SECRET: "b", AMAZON_CREATORS_AU_VERSION: "3.3" };
  assert.deepEqual(credentialsFor("us", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("uk", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("us", { ...au, AMAZON_CREATORS_US_CLIENT_ID: "u", AMAZON_CREATORS_US_CLIENT_SECRET: "v" }), { id: "u", secret: "v", version: "3.1" });
  assert.equal(credentialsFor("us", {}), null);
});

test("a credential from another country's account is a refusal, not 24,000 failed searches (2026-11-06)", () => {
  assert.ok(isWrongAccount('{"message":"Your credential is not linked to the partner tag in the request for the given Marketplace.","reason":"InvalidAssociate"'));
  assert.ok(!isWrongAccount('{"message":"Invalid keywords","reason":"InvalidParameterValue"}'));
});

const listing = (amount: number, o: Partial<{ cond: string; avail: string; cur: string; box: boolean; seller: string }> = {}) => ({
  price: { money: { amount, currency: o.cur ?? "AUD" } },
  condition: { value: o.cond ?? "New" },
  availability: { type: o.avail ?? "IN_STOCK" },
  isBuyBoxWinner: o.box,
  merchantInfo: { name: o.seller ?? "Amazon AU" },
});

test("the shown price is the new, in-stock buy box in AUD, else the cheapest such listing", () => {
  const item: Item = { asin: "B0TEST0001", offersV2: { listings: [listing(90, { cond: "Used" }), listing(95, { avail: "OUT_OF_STOCK" }), listing(110, { box: true }), listing(100, { seller: "Gadget Co" })] } };
  assert.deepEqual(pickListing(item, "AUD"), { amount: 110, seller: undefined });
  item.offersV2!.listings!.splice(2, 1);
  assert.deepEqual(pickListing(item, "AUD"), { amount: 100, seller: "Gadget Co" });
  assert.equal(pickListing({ asin: "B0TEST0002", offersV2: { listings: [listing(50, { cur: "USD" })] } }, "AUD"), null);
  assert.equal(pickListing({ asin: "B0TEST0003", offersV2: null }, "AUD"), null);
});

test("items are read from GetItems (itemResults) and SearchItems (searchResult)", () => {
  assert.equal(itemsOf({ itemResults: { items: [{ asin: "A" }] } })[0].asin, "A");
  assert.equal(itemsOf({ searchResult: { items: [{ asin: "B" }] } })[0].asin, "B");
  assert.deepEqual(itemsOf({}), []);
});

test("a price is shown for 24 hours after it was fetched, never longer", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");
  assert.ok(isFreshAmazonPrice("2026-11-03T00:00:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-02T11:59:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-04T00:00:00Z", now), "a time in the future is not trusted");
  assert.ok(!isFreshAmazonPrice(undefined, now));
  assert.ok(!isFreshAmazonPrice("not a date", now));
});

const phone = (titles: [string, string][]): Pick<Phone, "category" | "variants"> => ({
  category: "phones",
  variants: [...new Set(titles.map(([v]) => v))].map((id) => ({ id, label: id.toUpperCase(), storageGb: parseInt(id), offers: titles.filter(([v]) => v === id).map(([, title]) => ({ title, kind: "outright" })) })) as unknown as Phone["variants"],
});

test("an Amazon title joins a product only as the same product and storage", () => {
  const p = phone([["128gb", "Samsung Galaxy A17 4G 128GB (Black)"], ["256gb", "Samsung Galaxy A17 4G 256GB (Black)"]]);
  assert.ok(amazonTitleMatches(p, "128gb", "Samsung Galaxy A17 4G 128GB - Black"));
  assert.ok(!amazonTitleMatches(p, "256gb", "Samsung Galaxy A17 4G 128GB - Black"), "another storage is another variant");
  assert.ok(!amazonTitleMatches(p, "128gb", "Samsung Galaxy A27 4G 128GB - Black"), "another model");
  assert.ok(!amazonTitleMatches(p, "128gb", "Clear case for Samsung Galaxy A17 4G"), "an accessory");
});

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));

test("the Creators API client stays script-side; only the product page reads live Amazon prices", () => {
  const files = [...walk("src/app"), ...walk("src/components"), ...walk("src/views"), ...walk("src/lib")].filter((f) => /\.tsx?$/.test(f));
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    if (f !== "src/lib/amazon-creators.ts") assert.ok(!/amazon-creators/.test(s), `${f} imports the Creators API client`);
    if (/from "@\/lib\/amazon-live"|from "\.\/amazon-live"/.test(s)) assert.equal(f, "src/views/ProductView.tsx", `${f} reads live Amazon prices`);
    if (/process\.env\.AMAZON_CREATORS/.test(s)) assert.fail(`${f} reads Amazon credentials`);
  }
});

test("Amazon prices are fetched by the build and never committed", () => {
  assert.match(readFileSync(".gitignore", "utf8"), /^data\/amazon-live\/$/m);
  assert.match(JSON.parse(readFileSync("package.json", "utf8")).scripts.build, /^\(tsx scripts\/fetch-amazon-prices\.ts \|\| true\) && next build/);
});
