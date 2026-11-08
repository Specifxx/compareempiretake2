// Affiliate-network product feeds (scripts/scrapers/feed.ts): the big chains' only door (docs/stores/big-stores.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { feedRows, feedStore, headerMap, priceCurrency, rowsToOffers, scanDelimited, type FeedRow } from "../scripts/scrapers/feed";

const stream = (s: string) => new Blob([s]).stream() as ReadableStream<Uint8Array>;
async function all(s: string): Promise<FeedRow[]> {
  const out: FeedRow[] = [];
  for await (const r of feedRows(stream(s))) out.push(r);
  return out;
}

test("CSV, TSV and Google Shopping XML feeds read into the same rows", async () => {
  const csv = `"Product ID","Product Name","Price","Sale Price","Product URL","Image URL","Brand","MPN","Stock Availability","Currency"\n"OW1","Apple iPad 11-inch Wi-Fi 128GB Blue","599.00","549.00","https://go.example/ow1","https://img/1.jpg","Apple","MD4A4X/A","In Stock","AUD"\n`;
  const [c] = await all(csv);
  assert.equal(c.title, "Apple iPad 11-inch Wi-Fi 128GB Blue");
  assert.equal(c.salePrice, "549.00");
  assert.equal(c.mpn, "MD4A4X/A");
  const tsv = "aw_product_id\tproduct_name\tsearch_price\taw_deep_link\tmerchant_image_url\tbrand_name\tin_stock\n1\tLG 65\" OLED evo C5 4K TV\t1799\thttps://go.example/x\thttps://img/2.jpg\tLG\t1\n";
  const [t] = await all(tsv);
  assert.equal(t.title, 'LG 65" OLED evo C5 4K TV');
  assert.equal(t.price, "1799");
  assert.equal(t.link, "https://go.example/x");
  const xml = `<?xml version="1.0"?><rss><channel><title>Feed</title><item><g:id>7</g:id><title>Dyson V15 Detect Absolute Vacuum Cleaner</title><g:price>1349.00 AUD</g:price><g:sale_price>999.00 AUD</g:sale_price><link>https://go.example/7</link><g:brand>Dyson</g:brand><g:availability>in stock</g:availability></item></channel></rss>`;
  const [x] = await all(xml);
  assert.equal(x.title, "Dyson V15 Detect Absolute Vacuum Cleaner");
  assert.equal(x.price, "1349.00 AUD");
  assert.equal(priceCurrency(x.price), "AUD");
  assert.equal(priceCurrency("£1,299.00"), "GBP");
});

test("a quoted cell may hold a comma, an inch mark or a newline", () => {
  assert.deepEqual(scanDelimited('"Samsung 55"" TV, 4K","1,299.00"', ",").cells, ['Samsung 55" TV, 4K', "1,299.00"]);
  assert.equal(scanDelimited('"open', ",").open, true);
  assert.deepEqual([...headerMap(["g:id", "Title", "price", "LINK"]).values()], ["id", "title", "price", "link"]);
});

test("rows become offers through the shared title checks, in the right category, never in another currency", () => {
  const store = { retailer: "officeworks" as const, env: "FEED_URL_TEST", currency: "AUD" as const, cats: ["laptops", "tvs", "printers"] as const };
  const rows: FeedRow[] = [
    { id: "1", title: 'Samsung 65" Crystal UHD 4K DU7000 Smart TV', price: "999.00", salePrice: "849.00", link: "https://go.example/1", brand: "Samsung", availability: "In Stock" },
    { id: "2", title: 'HP 15.6" Laptop 15-fd0210TU Intel Core i5 16GB 512GB', price: "899", link: "https://go.example/2", brand: "HP", currency: "AUD" },
    { id: "3", title: "Brother MFC-L2820DW Mono Laser Printer", price: "299", link: "https://go.example/3", brand: "Brother", mpn: "MFC-L2820DW" },
    { id: "4", title: 'HP 15.6" Laptop 15-fd0210TU (Refurbished)', price: "499", link: "https://go.example/4" },
    { id: "5", title: "HP Laptop Sleeve 15.6 inch", price: "19", link: "https://go.example/5" },
    { id: "6", title: 'LG 55" OLED C5 4K TV', price: "1299.00 USD", link: "https://go.example/6" },
    { id: "7", title: 'LG 48" OLED B4 4K TV', price: "1099", link: "https://go.example/7", condition: "used" },
    { id: "8", title: 'LG 42" OLED C4 4K TV', price: "1099", link: "javascript:alert(1)" },
  ];
  const out = rowsToOffers(store, rows);
  assert.deepEqual([...out.keys()].sort(), ["laptops", "printers", "tvs"]);
  const tv = out.get("tvs")!;
  assert.equal(tv.length, 1, "the USD, used and bad-link TVs are dropped");
  assert.equal(tv[0].price, 849);
  assert.equal(tv[0].wasPrice, 999);
  assert.equal(tv[0].brand, "Samsung");
  assert.equal(out.get("laptops")!.length, 1, "the refurbished laptop and the sleeve are dropped");
  assert.equal(out.get("printers")![0].mpn, "MFC-L2820DW");
});

test("a feed store exports no scrapers until its secret exists", () => {
  delete process.env.FEED_URL_TEST;
  assert.deepEqual(feedStore({ retailer: "officeworks", env: "FEED_URL_TEST", currency: "AUD", cats: ["tvs"] }), {});
  process.env.FEED_URL_TEST = "https://example.test/feed.csv";
  assert.deepEqual(Object.keys(feedStore({ retailer: "officeworks", env: "FEED_URL_TEST", currency: "AUD", cats: ["tvs", "laptops"] })), ["tvs", "laptops"]);
  delete process.env.FEED_URL_TEST;
});

test("Awin: a joined chain's feed is found from the one datafeed key, with our columns", async () => {
  const { awinAdvertiser, awinFeedLink } = await import("../scripts/scrapers/feed");
  const joined = [{ id: 1599, domains: ["currys.co.uk", "pcworld.co.uk"] }, { id: 7, domains: ["ao.com"] }];
  assert.equal(awinAdvertiser("currys.co.uk", joined), 1599);
  assert.equal(awinAdvertiser("www.ao.com", joined), 7);
  assert.equal(awinAdvertiser("argos.co.uk", joined), undefined);
  assert.equal(awinAdvertiser(undefined, joined), undefined);
  const list = [
    `"Advertiser ID","Advertiser Name","Primary Region","Membership Status","Feed ID","Feed Name","Language","Vertical","Last Imported","Last Checked","No of products","URL"`,
    `"1599","Currys","GB","active","111","Currys small","en","Electronics","","","200","https://productdata.awin.com/datafeed/download/apikey/K/language/en/fid/111/columns/aw_deep_link,product_name/format/csv/delimiter/%2C/compression/gzip/"`,
    `"1599","Currys","GB","active","222","Currys main","en","Electronics","","","90000","https://productdata.awin.com/datafeed/download/apikey/K/language/en/fid/222/columns/aw_deep_link,product_name/format/csv/delimiter/%2C/compression/gzip/"`,
    `"7","AO","GB","not joined","333","AO","en","Electronics","","","5000",""`,
  ].join("\n");
  const link = awinFeedLink(list, 1599, "K");
  assert.match(link!, /\/fid\/222\//);
  assert.match(link!, /\/columns\/aw_deep_link,product_name,aw_product_id,.*,brand_name,ean,mpn,model_number,in_stock,condition\/format\/csv/);
  assert.equal(awinFeedLink(list, 7, "K"), undefined, "a feed of an advertiser we have not joined is never read");
  assert.equal(awinFeedLink(list, 42, "K"), undefined);
});

test("Awin: the real 2026-11-08 feed list (ui.awin.com, Datafeed Format column) gives Ryman's feed", async () => {
  const { awinFeedLink, AWIN_FEED_LISTS } = await import("../scripts/scrapers/feed");
  const list = [
    `Advertiser ID,Advertiser Name,Primary Region,Membership Status,Datafeed Format,Feed ID,Feed Name,Language,Vertical,Last Imported,Last Checked,No of products,URL`,
    `"78586","Needs No Label","GB","Not Joined","Google","F94","","English","Retail","2026-11-08 07:54:48","2026-11-08 07:54:48","843","https://ui.awin.com/productdata-darwin-download/publisher/3144410/K/1/feed/F94.csv.gz"`,
    `"3326","Ryman","GB","active","Awin","3326","Default","English","","2026-11-07 19:02:29","2026-11-08 07:13:59","27793","https://productdata.awin.com/datafeed/download/apikey/K/fid/3326/format/csv/language/en/delimiter/%2C/compression/gzip/adultcontent/1/columns/data_feed_id%2Cmerchant_id%2Cean/"`,
  ].join("\n");
  const link = awinFeedLink(list, 3326, "K");
  assert.match(link!, /^https:\/\/productdata\.awin\.com\/datafeed\/download\/apikey\/K\/fid\/3326\/format\/csv\//);
  assert.match(link!, /\/columns\/aw_deep_link,product_name,.*,ean,mpn,model_number,in_stock,condition\/$/);
  assert.equal(awinFeedLink(list, 78586, "K"), undefined, "Not Joined is never read");
  assert.match(AWIN_FEED_LISTS("K")[0], /^https:\/\/ui\.awin\.com\/productdata-darwin-download\/publisher\/3144410\/K\/1\/feedList$/);
});

test("a feed-gated store stays off with neither its secret nor an Awin membership", () => {
  delete process.env.FEED_URL_UK_CURRYS;
  process.env.AWIN_DATAFEED_KEY = "K";
  assert.deepEqual(feedStore({ retailer: "uk-currys", env: "FEED_URL_UK_CURRYS", currency: "GBP", cats: ["tvs"] }), {});
  delete process.env.AWIN_DATAFEED_KEY;
});
