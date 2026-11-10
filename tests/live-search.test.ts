import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFamilySearch, feedItems, searchFamily, type FamilySearchIndex } from "../src/lib/family-search";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
/** lib/catalog.ts imports "server-only": run under the react-server condition, as tests/client-data.test.ts does. */
function server<T>(code: string): T {
  const out = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  return JSON.parse(out.trim().split("\n").pop()!) as T;
}
const lib = (f: string) => JSON.stringify(path.join(ROOT, "src", f));

// Search everything and the MCP server (owner, 2026-11-10, plan B; DECISIONS.md 2026-11-10).

const NOW = Date.parse("2026-11-10T08:00:00Z");
const feed = (site: string, items: Record<string, unknown>, generatedAt = "2026-11-10T07:00:00Z") => ({ v: 1, site, generatedAt, items, deals: [] });

test("a sister's feed: only well-formed products with whole positive cents in known regions", () => {
  const got = feedItems(
    "dex",
    feed("dex", {
      a: { n: "Prismatic Evolutions  Elite Trainer Box", u: "/{r}/p/prismatic-etb", p: { US: 5999, AU: 12900, XX: 100, UK: 0 } },
      b: { n: "Bad path", u: "https://evil.example/x", p: { US: 100 } },
      c: { n: "Up a level", u: "/../x", p: { US: 100 } },
      d: { n: "Converted", u: "/x", p: { US: 12.5 } },
      e: { n: "", u: "/x", p: { US: 100 } },
    }),
  );
  assert.ok(got);
  assert.deepEqual(got.items, [["dex", "Prismatic Evolutions Elite Trainer Box", "/{r}/p/prismatic-etb", { US: 5999, AU: 12900 }]]);
  assert.equal(feedItems("mtg", feed("dex", {})), null, "a feed claiming another site is refused");
  assert.equal(feedItems("dex", { v: 2, site: "dex", generatedAt: "2026-11-10", items: {} }), null);
});

test("a site that failed today keeps yesterday's items; a site over four days old drops out of results", () => {
  const yesterday: FamilySearchIndex = { v: 1, generatedAt: "2026-11-09T07:00:00Z", sites: { mtg: "2026-11-09T07:00:00Z", figure: "2026-11-01T07:00:00Z" }, items: [["mtg", "Foundations Play Booster Box", "/{r}/p/fdn", { US: 13999 }], ["figure", "Nendoroid Miku", "/f/miku", { US: 5500 }]] };
  const dex = feedItems("dex", feed("dex", { a: { n: "Foundations of Fun Box", u: "/{r}/p/fun", p: { US: 2000 } } }))!;
  const idx = buildFamilySearch({ dex }, yesterday, new Date(NOW));
  assert.equal(idx.items.length, 3);
  assert.equal(idx.sites.mtg, "2026-11-09T07:00:00Z");
  const hits = searchFamily(idx, "foundations", "US", 10, NOW);
  assert.deepEqual(hits.map((h) => h.url).sort(), ["https://dexcompare.app/us/p/fun", "https://mtgcompare.app/us/p/fdn"]);
  assert.equal(searchFamily(idx, "miku", "US", 10, NOW).length, 0, "FigureCompare's feed is nine days old");
  assert.equal(searchFamily(idx, "foundations", "UK", 10, NOW).length, 0, "no UK price, no UK result: never a conversion");
  assert.equal(hits.find((h) => h.site === "mtg")?.currency, "USD");
});

test("search everything: normalised query, our own products, a tagged eBay search and never Amazon", () => {
  const r = server<{ norm: string; a: { query: string; currency: string; products: { url: string }[]; ebay: { url: string } } }>(
    `const m = await import(${lib("lib/live-search.ts")}); console.log(JSON.stringify({ norm: m.normaliseQuery("  iPhone   17 PRO "), a: m.searchEverything("iphone", "us", { now: ${NOW} }) }));`,
  );
  assert.equal(r.norm, "iphone 17 pro");
  assert.equal(r.a.query, "iphone");
  assert.equal(r.a.currency, "USD");
  assert.ok(r.a.products.length > 0, "the US catalogue has iPhones");
  for (const p of r.a.products) assert.match(p.url, /^https:\/\/compareempire\.com\/us\//);
  assert.match(r.a.ebay.url, /campid=5339155912/);
  assert.match(r.a.ebay.url, /customid=ce-us-search/);
  assert.doesNotMatch(JSON.stringify(r.a), /amazon\./i, "no Amazon search for typed words (Operating Agreement)");
});

test("/api/search: six-hour CDN cache, short queries and unknown regions refused", () => {
  const r = server<{ ok: number; cdn: string; short: number; region: number }>(
    `const { GET } = await import(${lib("app/api/search/route.ts")});
     const ok = GET(new Request("https://compareempire.com/api/search?q=pixel&r=us"));
     console.log(JSON.stringify({ ok: ok.status, cdn: ok.headers.get("vercel-cdn-cache-control"), short: GET(new Request("https://compareempire.com/api/search?q=a&r=us")).status, region: GET(new Request("https://compareempire.com/api/search?q=pixel&r=fr")).status }));`,
  );
  assert.equal(r.ok, 200);
  assert.match(r.cdn, /s-maxage=21600/);
  assert.equal(r.short, 400);
  assert.equal(r.region, 400);
});

test("MCP: initialize, tools/list, tools/call, notifications and bad input", () => {
  type R = { result?: { protocolVersion?: string; capabilities?: { tools?: unknown }; tools?: { name: string }[]; isError?: boolean; structuredContent?: { products?: { url: string }[]; variants?: { offers: unknown[] }[] } }; error?: { code: number } } | null;
  const r = server<{ init: R; note: R; list: R; call: R; cmp: R; hist: R; unknown: R; nope: R; batch: R; names: string[] }>(
    `const m = await import(${lib("lib/mcp.ts")});
     const h = (x) => m.handleMcp(x);
     const call = h({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_products", arguments: { query: "iPhone 17", region: "us", limit: 3 } } });
     const url = call.result.structuredContent.products[0]?.url;
     console.log(JSON.stringify({
       init: h({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } } }),
       note: h({ jsonrpc: "2.0", method: "notifications/initialized" }),
       list: h({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
       call,
       cmp: h({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "compare_prices", arguments: { product: url } } }),
       hist: h({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "price_history", arguments: { product: url, days: 30 } } }),
       unknown: h({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "compare_prices", arguments: { product: "/phones/not-a-product" } } }),
       nope: h({ jsonrpc: "2.0", id: 7, method: "nope" }),
       batch: h([1, 2]),
       names: m.MCP_TOOLS.map((t) => t.name),
     }));`,
  );
  assert.equal(r.init?.result?.protocolVersion, "2025-03-26");
  assert.ok(r.init?.result?.capabilities?.tools);
  assert.equal(r.note, null, "a notification gets no response");
  assert.deepEqual(r.list?.result?.tools?.map((t) => t.name), r.names);
  assert.deepEqual(r.names, ["search_products", "compare_prices", "price_history"]);
  assert.equal(r.call?.result?.isError, false);
  assert.ok(r.call?.result?.structuredContent?.products?.length);
  assert.equal(r.cmp?.result?.isError, false);
  assert.ok(r.cmp?.result?.structuredContent?.variants?.some((v) => v.offers.length));
  assert.equal(r.hist?.result?.isError, false);
  assert.equal(r.unknown?.result?.isError, true);
  assert.equal(r.nope?.error?.code, -32601);
  assert.equal(r.batch?.error?.code, -32600);
  assert.doesNotMatch(JSON.stringify(r.call), /amazon\./i, "MCP answers carry no Amazon link or price");
});
