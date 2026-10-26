import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, truncateSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { facetValue, FACETS, GRID_FORMAT, gridProps, isSort, packGrid, PAGE_SIZE, SORT_FNS, SORTS, toGridItem, unpackGrid } from "../src/lib/browse";
import type { PhoneSummary } from "../src/lib/catalog";
import { compareGroup, MAX_QUERY, MAX_REFS, normaliseHref, parseHref, parseProductQuery, productsUrls } from "../src/lib/product-refs";

/**
 * What prerendered pages send the browser. /compare once carried every Australian product (19.6 MB
 * of HTML, over Vercel's 20 MB limit for a prerendered page), /saved every summary (8.2 MB) and each
 * category grid its whole category. Now the grid sends one page plus a static list file, and the
 * compare table and saved list ask /api/products for just their products.
 */
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const files = walk(SRC).map((f) => ({ f: rel(f), s: readFileSync(f, "utf8") }));
const isClient = (s: string) => /^\s*["']use client["']/.test(s);

// ---------------------------------------------------------------- /api/products input rules

test("product paths: a region prefix, a known category and a slug, nothing else", () => {
  assert.deepEqual(parseHref("/phones/apple-iphone-17-pro"), { href: "/phones/apple-iphone-17-pro", region: "au", category: "phones", slug: "apple-iphone-17-pro" });
  assert.equal(parseHref("/us/tvs/lg-c5-65")?.region, "us");
  assert.equal(parseHref("/uk/graphics-cards/rtx-5070")?.category, "graphics-cards");
  for (const bad of [
    "",
    "/",
    "/phones",
    "/phones/",
    "/phones/x/",
    "phones/x",
    "/au/phones/x",
    "/de/phones/x",
    "/widgets/x",
    "/api/products",
    "/phones/X",
    "/phones/a_b",
    "/phones/a.b",
    "/phones/../admin",
    "//evil.example/x",
    "/phones/<script>",
    "/phones/x?y=1",
    "/phones/x#y",
    "/phones/x y",
    "/phones/x\n",
    "/us/uk/phones/x",
    `/phones/${"a".repeat(300)}`,
  ])
    assert.equal(parseHref(bad), null, JSON.stringify(bad));
  // Lists saved before paths were stored hold bare phone slugs.
  assert.equal(normaliseHref("apple-iphone-17"), "/phones/apple-iphone-17");
  assert.equal(normaliseHref("/tvs/x"), "/tvs/x");
});

test("the query is refused as a whole, with a fixed message that never repeats the input", () => {
  const ok = parseProductQuery("/phones/b,/phones/a,/phones/b,,/us/tvs/c", null);
  assert.ok(ok.ok);
  assert.deepEqual(ok.refs.map((r) => r.href), ["/phones/b", "/phones/a", "/us/tvs/c"], "deduplicated, empty entries dropped");
  assert.equal(ok.view, "full");
  const sum = parseProductQuery("/phones/a", "summary");
  assert.equal(sum.ok && sum.view, "summary");
  assert.equal(parseProductQuery("/phones/a", "full").ok, true);
  const many = Array.from({ length: MAX_REFS + 1 }, (_, i) => `/phones/p${i}`).join(",");
  const errors = new Set<string>();
  for (const [p, view] of [
    [null, null],
    ["", null],
    [",,", null],
    ["/phones/a", "html"],
    ["/phones/a", ""],
    [many, null],
    [`/phones/${"a".repeat(MAX_QUERY)}`, null],
    ["/phones/a,/phones/<img src=x onerror=alert(1)>", null],
    ["/phones/a,javascript:alert(1)", null],
  ] as const) {
    const r = parseProductQuery(p, view);
    assert.equal(r.ok, false, `${p} ${view}`);
    if (!r.ok) errors.add(r.error);
  }
  // Four fixed messages, whatever was sent.
  assert.deepEqual([...errors].sort(), ["p is required", "p must list product paths like /phones/apple-iphone-17-pro", "too many products", "view must be full or summary"]);
  assert.equal(parseProductQuery(Array.from({ length: MAX_REFS }, (_, i) => `/phones/p${i}`).join(","), null).ok, true, "exactly MAX_REFS is fine");
});

test("the browser's requests are what the endpoint accepts: sorted, deduplicated, chunked", () => {
  const [one] = productsUrls(["/phones/b", "/phones/a", "/phones/b", "/bad/<x>"], "summary");
  assert.equal(one.url, "/api/products?p=/phones/a,/phones/b&view=summary");
  assert.equal(productsUrls(["/phones/a"], "full")[0].url, "/api/products?p=/phones/a");
  // The saved list holds up to 100 products, and real paths reach ~190 characters.
  const long = Array.from({ length: 100 }, (_, i) => `/uk/laptops/${"x".repeat(170)}-${i}`);
  const reqs = productsUrls(long, "summary");
  assert.ok(reqs.length >= 3, `${reqs.length} requests`);
  assert.deepEqual(reqs.flatMap((r) => r.hrefs).sort(), [...long].sort(), "every path asked for once");
  for (const r of reqs) {
    const q = new URL(r.url, "https://x").searchParams;
    const parsed = parseProductQuery(q.get("p"), q.get("view"));
    assert.ok(parsed.ok, r.url.slice(0, 80));
    assert.ok(r.url.length < 8000);
  }
});

// ---------------------------------------------------------------- the real routes, with today's data

/** Runs `code` with the routes' modules (react-server condition: lib/catalog.ts imports "server-only") and returns what it prints. */
function server<T>(code: string): T {
  const out = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  return JSON.parse(out) as T;
}
const mod = (f: string) => `(async () => { const m = await import(${JSON.stringify(path.join(SRC, f))}); return m.GET ? m : m.default; })()`;
const firstSlug = (dir: string) => (JSON.parse(readFileSync(path.join(ROOT, "data", dir, "catalog.json"), "utf8")) as { phones: { slug: string }[] }).phones[0].slug;

test("/api/products answers with the products asked for, cached like a product page", () => {
  const au = `/phones/${firstSlug("phones")}`;
  const us = `/us/tvs/${firstSlug("us/tvs")}`;
  const r = server<{ status: number; headers: Record<string, string>; hrefs: string[]; slugs: string[]; full: boolean; bad: { status: number; headers: Record<string, string>; body: string }[] }>(`
    const api = await ${mod("app/api/products/route.ts")};
    const get = (q) => api.GET(new Request("https://www.compareempire.com/api/products?" + q));
    const s = get("p=${au},${us},/phones/no-such-phone&view=summary");
    const f = get("p=${au}");
    const sum = (await s.json()).products, full = (await f.json()).products;
    const bad = [];
    for (const q of ["p=/phones/%3Cscript%3E", "p=/widgets/x", "view=summary", "p=${au}&view=page", "p=" + Array.from({ length: 51 }, (_, i) => "/phones/p" + i).join(",")]) {
      const b = get(q);
      bad.push({ status: b.status, headers: Object.fromEntries(b.headers), body: await b.text() });
    }
    console.log(JSON.stringify({ status: s.status, headers: Object.fromEntries(s.headers), hrefs: sum.map((p) => p.href), slugs: full.map((p) => p.slug), full: !!full[0]?.variants?.[0]?.offers, bad }));
  `);
  assert.equal(r.status, 200);
  assert.deepEqual(r.hrefs, [au, us], "summaries for the known products, in the order asked; unknown ones left out");
  assert.deepEqual(r.slugs, [au.split("/").pop()]);
  assert.ok(r.full, "the full view carries variants and offers for the compare table");
  assert.equal(r.headers["cache-control"], "public, max-age=300");
  assert.match(r.headers["vercel-cdn-cache-control"], /^public, s-maxage=86400\b/);
  for (const b of r.bad) {
    assert.equal(b.status, 400, b.body);
    assert.equal(b.headers["cache-control"], "no-store");
    assert.equal(b.headers["vercel-cdn-cache-control"], undefined, "a refusal is never CDN-cached");
    assert.doesNotMatch(b.body, /script|widgets|page|p50/);
  }
});

test("the static grid lists cover every grid with more than a page, and hold the whole grid", () => {
  const r = server<{ cat: { region: string; category: string }[]; brand: { brand: string }[]; counts: Record<string, number>; brandCounts: Record<string, number>; sample: { n: number; keys: string[]; shared: string[]; header: string | null } }>(`
    const grid = await ${mod("app/api/grid/[region]/[category]/route.ts")};
    const brands = await ${mod("app/api/grid/brands/[brand]/route.ts")};
    const cat = await grid.generateStaticParams();
    const brand = await brands.generateStaticParams();
    const fs = await import("node:fs");
    const counts = {};
    for (const region of ["", "us", "uk"]) for (const d of fs.readdirSync(["data", region].filter(Boolean).join("/"))) {
      const f = ["data", region, d, "catalog.json"].filter(Boolean).join("/");
      if (fs.existsSync(f)) counts[(region || "au") + "/" + d] = JSON.parse(fs.readFileSync(f, "utf8")).phones.length;
    }
    const brandCounts = {};
    for (const [k, n] of Object.entries(counts)) if (k.startsWith("au/")) for (const p of JSON.parse(fs.readFileSync("data/" + k.slice(3) + "/catalog.json", "utf8")).phones) brandCounts[p.brand] = (brandCounts[p.brand] ?? 0) + 1;
    const res = await grid.GET(new Request("https://x/api/grid/au/phones"), { params: Promise.resolve({ region: "au", category: "phones" }) });
    const file = await res.json();
    const items = file.items;
    console.log(JSON.stringify({ cat, brand, counts, brandCounts, sample: { n: items.length, keys: [...new Set(items.flatMap((p) => Object.keys(p)))].sort(), shared: Object.keys(file).sort(), header: res.headers.get("cache-control") } }));
  `);
  const want = Object.entries(r.counts).filter(([, n]) => n > PAGE_SIZE).map(([k]) => k).sort();
  assert.deepEqual(r.cat.map((p) => `${p.region}/${p.category}`).sort(), want, "one list per region and category with more than a page");
  assert.equal(r.brand.length, Object.values(r.brandCounts).filter((n) => n > PAGE_SIZE).length, "one list per brand with more than a page");
  assert.equal(r.sample.n, r.counts["au/phones"], "the list is the whole category");
  for (const k of ["slug", "offerCount", "topPrice", "category", "region"]) assert.ok(!r.sample.keys.includes(k), `${k} is not sent per product`);
  for (const k of ["href", "brand", "model", "bestPrice", "retailerCount", "generation"]) assert.ok(r.sample.keys.includes(k), `${k} is sent`);
  assert.deepEqual(r.sample.shared, ["category", "items", "region"], "a category's category and region are sent once");
  assert.match(r.sample.header ?? "", /^public, max-age=\d+/);
});

// ---------------------------------------------------------------- the grid's first page

const summary = (i: number, o: Partial<PhoneSummary> = {}): PhoneSummary => ({
  slug: `p${i}`,
  category: "tvs",
  href: `/tvs/p${i}`,
  subtitle: "",
  facets: { "Screen size": `${50 + (i % 4) * 5}"`, Panel: i % 3 ? "OLED" : "LED", Warranty: "1 year", Weight: "20 kg" },
  name: `${["LG", "Sony", "Samsung"][i % 3]} M${i}`,
  brand: ["LG", "Sony", "Samsung"][i % 3],
  model: `M${i}`,
  bestPrice: 500 + ((i * 37) % 900),
  topPrice: 2000,
  storages: [0],
  retailerCount: (i * 7) % 5,
  offerCount: 3,
  generation: (i * 3) % 4,
  saving: (i * 11) % 120,
  inStock: i % 2 === 0,
  atLowest: false,
  region: "au",
  ...o,
});

test("a grid sends its first page in the default order, the filters counted over everything, and where the rest is", () => {
  const all = Array.from({ length: 300 }, (_, i) => summary(i));
  const g = gridProps(all, "tvs", { brands: true, cats: false, src: "/api/grid/au/tvs", version: "abc" });
  assert.equal(g.total, 300);
  assert.equal(g.initial.length, PAGE_SIZE);
  // What the browser shows for the default view once the whole list arrives: the same first page.
  const full = all.map((p) => toGridItem(p, "tvs"));
  assert.deepEqual([...full].sort(SORT_FNS.popular).slice(0, PAGE_SIZE), g.initial);
  assert.equal(g.src, `/api/grid/au/tvs?v=${GRID_FORMAT}.abc`);
  assert.deepEqual(g.options.brands, [["LG", 100], ["Sony", 100], ["Samsung", 100]]);
  assert.equal(g.options.cats, undefined);
  const size = g.options.facets.find((f) => f.key === "Screen size")!;
  assert.equal(size.opts.reduce((n, [, c]) => n + c, 0), 300, "facet counts cover the whole list, not the first page");
  assert.deepEqual(size.opts.map(([v]) => v), ['50"', '55"', '60"', '65"'].filter((v) => size.opts.some(([x]) => x === v)));
  // A list that fits on one page needs no file.
  const small = gridProps(all.slice(0, PAGE_SIZE), "tvs", { brands: true, cats: false, src: "/x", version: "abc" });
  assert.equal(small.src, undefined);
  assert.equal(small.initial.length, PAGE_SIZE);
});

test("a list file unpacks to exactly the grid items", () => {
  const cat = Array.from({ length: 60 }, (_, i) => toGridItem(summary(i, i === 3 ? { name: "Odd name" } : {}), "tvs"));
  const packed = packGrid(cat);
  assert.equal(packed.category, "tvs");
  assert.equal(packed.region, "au");
  assert.ok(!("name" in packed.items[0]) && packed.items[3].name === "Odd name", "names kept only where they aren't brand and model");
  const wire = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  assert.deepEqual(unpackGrid(wire(packed)), wire(cat));
  // A brand's list spans categories: those stay on each product.
  const mixed = cat.map((p, i) => ({ ...p, category: i % 2 ? ("tvs" as const) : ("monitors" as const) }));
  const m = packGrid(mixed);
  assert.equal(m.category, undefined);
  assert.deepEqual(unpackGrid(wire(m)), wire(mixed));
  assert.deepEqual(unpackGrid(packGrid([])), []);
});

test("grid items carry only what the grid reads", () => {
  const p = toGridItem(summary(1, { atLowest: true }), "tvs");
  assert.deepEqual(Object.keys(p.facets ?? {}).sort(), FACETS.tvs.map((f) => f.key).filter((k) => k in summary(1).facets).sort(), "only the category's filter facets");
  assert.equal(facetValue(p, FACETS.tvs[0]), '55"');
  for (const k of ["slug", "offerCount", "topPrice"]) assert.ok(!(k in p), k);
  assert.equal(p.atLowest, true);
  const q = toGridItem(summary(1, { inStock: false, foldable: false }), "all");
  assert.ok(!("inStock" in q) && !("foldable" in q) && !("atLowest" in q) && !("facets" in q), "false flags and empty facets are left out");
});

// ---------------------------------------------------------------- no page hands the client a catalogue

// Loaders that return products (getVsPairs holds whole products too). getBrands is one small row per brand: /brands sends all of them.
const LOADER = "getProducts|getSummaries|getCatalog|getPhones|getDeals|getVsPairs|getSearchIndex|similarPhones";
/** Removes `gridProps(...)` calls (balanced parentheses): the one sanctioned way to give the grid a list, capped at a page. */
function withoutGridProps(s: string): string {
  let out = s;
  for (let i = out.indexOf("gridProps("); i >= 0; i = out.indexOf("gridProps(")) {
    let depth = 0;
    let j = i + "gridProps".length;
    for (; j < out.length; j++) {
      if (out[j] === "(") depth++;
      else if (out[j] === ")" && --depth === 0) break;
    }
    out = out.slice(0, i) + out.slice(j + 1);
  }
  return out;
}
/** Client components in `source` whose props name a catalogue loader, or a variable holding a loader's list. */
function offences(source: string, client: Set<string>): string[] {
  const bound = new Set<string>();
  // Any variable given a loader's result (sliced, filtered or mapped too), unless what follows makes it a count or one item.
  for (const m of source.matchAll(new RegExp(`(?:const|let)\\s+(\\{[^}]*\\}|\\w+)\\s*=\\s*(?:${LOADER})\\([^)]*\\)(?!\\s*(?:\\.length\\b|\\.(?:find|findLast|some|every|reduce|includes|indexOf|at)\\(|\\[))`, "g")))
    for (const name of m[1].replace(/[{}]/g, "").split(",")) if (name.trim()) bound.add(name.split(":").pop()!.trim());
  const out: string[] = [];
  for (const m of source.matchAll(/<([A-Z]\w*)\b(?:=>|[^>])*>/g)) {
    if (!client.has(m[1])) continue;
    const tag = withoutGridProps(m[0]);
    if (new RegExp(`\\b(?:${LOADER})\\(`).test(tag) || [...bound].some((b) => new RegExp(`\\b${b}\\b`).test(tag))) out.push(m[0].slice(0, 120));
  }
  return out;
}

test("no server component passes a catalogue to a client component", () => {
  const client = new Set(files.filter((x) => isClient(x.s)).flatMap((x) => [...x.s.matchAll(/export (?:default )?(?:function |const )(\w+)/g)].map((m) => m[1])));
  for (const name of ["PhoneBrowser", "CompareView", "SavedList", "Header", "FooterBody"]) assert.ok(client.has(name), name);
  // The checker catches what /compare, /saved and the category pages used to do.
  assert.deepEqual(offences(`<CompareView phones={getProducts()} />`, client).length, 1);
  assert.deepEqual(offences(`const products = getSummaries(id, region);\n<PhoneBrowser phones={products} category={id} />`, client).length, 1);
  assert.deepEqual(offences(`const phones = getSummaries().filter((p) => p.brand === b);\n<PhoneBrowser phones={phones} />`, client).length, 1);
  assert.deepEqual(offences(`const all = getSummaries(id).slice();\n<PhoneBrowser phones={all} />`, client).length, 1, "a copied list");
  assert.deepEqual(offences(`const top = getDeals(region).slice(0, 4000);\n<PhoneBrowser phones={top} />`, client).length, 1, "a sliced list");
  assert.deepEqual(offences(`const products = getSummaries(id, region);\n<PhoneBrowser {...gridProps(products, id, { a: 1 })} category={id} />`, client), []);
  assert.deepEqual(offences(`const n = getSummaries(id).length;\n<PhoneBrowser count={n} />`, client), [], "a count is fine");
  let checked = 0;
  for (const { f, s } of files) {
    if (isClient(s)) continue;
    checked++;
    assert.deepEqual(offences(s, client), [], f);
  }
  assert.ok(checked > 30, `checked ${checked} server files`);
});

test("the grid only ever gets its list through gridProps, and the compare and saved pages pass nothing", () => {
  const uses = files.flatMap(({ f, s }) => [...s.matchAll(/<PhoneBrowser\b(?:=>|[^>])*>/g)].map((m) => ({ f, tag: m[0] })));
  assert.ok(uses.length >= 2, `${uses.length} grids`);
  for (const u of uses) assert.match(u.tag, /\{\.\.\.gridProps\(/, u.f);
  const page = (f: string) => readFileSync(path.join(SRC, f), "utf8");
  assert.match(page("app/compare/page.tsx"), /<CompareView \/>/);
  assert.match(page("app/saved/page.tsx"), /<SavedList \/>/);
  assert.doesNotMatch(page("components/CompareView.tsx") + page("components/SavedList.tsx"), /\bphones\s*[}:]/, "no catalogue props");
});

// ---------------------------------------------------------------- the browser side of the grid and the compare tray

test("?sort= takes only the sorts we offer, never a built-in", () => {
  for (const k of Object.keys(SORTS)) assert.ok(isSort(k), k);
  for (const bad of ["", "relevance", "valueOf", "toString", "hasOwnProperty", "__proto__", "constructor", "Popular"]) assert.equal(isSort(bad), false, bad);
  // What PhoneBrowser does with an unknown one: the view's default, so nothing calls a built-in as a comparator.
  const items = [{ retailerCount: 1, generation: 1, bestPrice: 2, saving: 0 }, { retailerCount: 2, generation: 1, bestPrice: 1, saving: 0 }];
  for (const s of ["valueOf", "__proto__", "price-asc"]) assert.doesNotThrow(() => [...items].sort(SORT_FNS[isSort(s) ? s : "popular"]), s);
});

test("the compare tray holds one region and category at a time", () => {
  assert.equal(compareGroup("/phones/apple-iphone-17"), "au/phones");
  assert.equal(compareGroup("apple-iphone-17"), "au/phones", "an early save is a bare phone slug");
  assert.equal(compareGroup("/us/tvs/lg-c5"), "us/tvs");
  assert.equal(compareGroup("/uk/tvs/lg-c5"), "uk/tvs");
  // The old guard split on "/" and called every US product "us".
  assert.notEqual(compareGroup("/us/headphones/a"), compareGroup("/us/tvs/b"));
  assert.notEqual(compareGroup("/tvs/a"), compareGroup("/us/tvs/a"));
  assert.equal(compareGroup("/widgets/x"), null);
  const toggle = readFileSync(path.join(SRC, "components/CompareToggle.tsx"), "utf8");
  const view = readFileSync(path.join(SRC, "components/CompareView.tsx"), "utf8");
  assert.match(toggle, /compareGroup\(/, "the Compare button uses it");
  assert.match(view, /compareGroup\(h\) === compareGroup\(valid\[0\]\)/, "the table drops what a hand-made link mixes in");
  assert.doesNotMatch(view, /key=\{p\.slug\}/, "columns are keyed by path: one slug can exist in two regions");
});

test("the head script marks every grid query key, so a filtered deep link never paints unfiltered cards", () => {
  const layout = readFileSync(path.join(SRC, "app/layout.tsx"), "utf8");
  const m = /try\{if\(\/(.+?)\/\.test\(location\.search\)\)document\.documentElement\.classList\.add\('gq'\)/.exec(layout);
  assert.ok(m, "the layout's head script tests location.search");
  const marks = new RegExp(m[1].replace(/\\\\/g, "\\"));
  const browser = readFileSync(path.join(SRC, "components/PhoneBrowser.tsx"), "utf8");
  const keys = [...new Set([...browser.matchAll(/params\.get\("([^"]+)"\)/g)].map((x) => x[1]))];
  for (const k of ["q", "brand", "min", "max", "sort", "cat"]) assert.ok(keys.includes(k), k);
  for (const k of keys) assert.ok(marks.test(`?${k}=price-asc`), `?${k}= is marked`);
  assert.ok(marks.test("?f.screen-size=55%22"), "facet keys");
  assert.ok(marks.test("?utm_source=x&brand=HP"), "a key after another parameter");
  for (const unmarked of ["", "?utm_source=reddit", "?sort=popular", "?sort=popular&utm=1", "?q=", "?fbrand=x", "?p=/phones/a"]) assert.ok(!marks.test(unmarked), unmarked);
  const css = readFileSync(path.join(SRC, "app/globals.css"), "utf8");
  assert.match(css, /html\.gq \[data-grid-fallback\] \[data-unfiltered\] \{ display: none; \}/);
  assert.match(browser, /data-grid-fallback=\{fallback \? "" : undefined\}/);
});

test("the build fails before Vercel would refuse a prerendered output, and names the big ones", () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
  assert.match(pkg.scripts.build, /^next build && node scripts\/check-prerender-size\.mjs$/);
  const dir = mkdtempSync(path.join(os.tmpdir(), "prerender-"));
  const file = (rel: string, bytes: number) => {
    const p = path.join(dir, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, "");
    truncateSync(p, bytes); // sparse: no 16 MB actually written
  };
  const run = () => spawnSync(process.execPath, [path.join(ROOT, "scripts/check-prerender-size.mjs"), dir], { encoding: "utf8" });
  try {
    file("index.html", 300_000);
    file("index.rsc", 100_000);
    file("search-index.json.body", 3_000_000);
    file("brands/x.meta", 30_000_000);
    let r = run();
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /search-index\.json\.body/);
    assert.doesNotMatch(r.stdout, /\.meta/, "only .html, .rsc and .body count");
    assert.match(r.stderr, /warning: search-index\.json\.body is 3\.00 MB/);
    file("compare.html", 16_000_000);
    r = run();
    assert.equal(r.status, 1);
    assert.match(r.stderr, /error: compare\.html is 16\.00 MB/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
