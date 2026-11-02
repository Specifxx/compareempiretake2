import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeAppPath } from "next/dist/shared/lib/router/utils/app-paths";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { CATEGORIES } from "../src/lib/categories";

// Files are read as text: src/lib/catalog.ts imports "server-only", which throws outside Next.
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");
const PRODUCT_PAGES = ["src/app/[category]/[slug]/page.tsx", "src/app/us/[category]/[slug]/page.tsx", "src/app/uk/[category]/[slug]/page.tsx"];
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");
const sourceFiles = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));

test("product pages render on request: force-dynamic, never ISR or prerendered", () => {
  for (const f of PRODUCT_PAGES) {
    const s = read(f);
    assert.match(s, /export const dynamic = "force-dynamic"/, f);
    assert.doesNotMatch(s, /generateStaticParams|dynamicParams|revalidate/, f);
  }
});

test("every other dynamic segment stays prerendered with dynamicParams = false", () => {
  const routes = walk(APP).filter((f) => /\/(page\.tsx|route\.tsx?)$/.test(f) && /\[[^\]]+\]/.test(rel(f)));
  assert.ok(routes.length > 10);
  for (const f of routes) {
    if (PRODUCT_PAGES.includes(rel(f))) continue;
    assert.match(readFileSync(f, "utf8"), /dynamicParams = false/, `${rel(f)} would quietly become on-demand ISR`);
  }
});

test("no ISR anywhere: no revalidate export, no unstable_cache", () => {
  for (const f of sourceFiles) {
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /export const revalidate/, rel(f));
    assert.doesNotMatch(s, /unstable_cache/, rel(f));
  }
});

test("the CDN header covers product URLs only", async () => {
  // Imported by URL so TypeScript doesn't need declarations for the .mjs config.
  const config = (await import(pathToFileURL(path.join(ROOT, "next.config.mjs")).href)).default;
  const ids = CATEGORIES.map((c) => c.id).join("|");
  const rules: { source: string; has?: unknown; missing?: unknown; headers: { key: string; value: string }[] }[] = await config.headers();
  assert.deepEqual(
    rules.map((r) => r.source),
    [`/:category(${ids})/:slug`, `/:region(us|uk)/:category(${ids})/:slug`],
    "CATEGORY_IDS in next.config.mjs must list exactly the CATEGORIES ids",
  );
  for (const r of rules) {
    // With no user agent Next streams metadata into <body>; such a render must never become the cached copy.
    assert.deepEqual(r.has, [{ type: "header", key: "user-agent", value: ".+" }], r.source);
    // Only the HTML document is CDN-cached, never an RSC payload under the same URL.
    assert.deepEqual(r.missing, [{ type: "header", key: "rsc" }], r.source);
    assert.deepEqual(r.headers.map((h) => h.key), ["Vercel-CDN-Cache-Control"]);
    assert.match(r.headers[0].value, /^public, s-maxage=\d+/);
  }
  const matches = (p: string) => rules.some((r) => getPathMatch(r.source)(p) !== false);
  for (const p of ["/phones/x", "/us/tvs/x", "/uk/robot-vacuums/y", "/graphics-cards/rtx"]) assert.ok(matches(p), p);
  for (const p of ["/api/reviews", "/api/alerts", "/api/alerts/confirm", "/api/admin/login", "/og/x", "/brands/apple", "/sitemaps/a.xml", "/compare/a-vs-b", "/guides/x", "/deals/tvs", "/browse/tvs", "/us/browse/tvs", "/us/deals/tvs", "/phones", "/us/phones", "/admin", "/"]) {
    assert.ok(!matches(p), p);
  }
});

test("routes rendered on request trace the catalogues, never raw, history or archive", async () => {
  const config = (await import(pathToFileURL(path.join(ROOT, "next.config.mjs")).href)).default;
  // Exactly what collect-build-traces does: picomatch(key, { dot, contains }) against normalizeAppPath(entryName),
  // where entryName is "app/[category]/[slug]/page" (so the route is "/app/[category]/[slug]", and the root is "/app").
  const picomatch: (glob: string, o: object) => (route: string) => boolean = createRequire(__filename)("next/dist/compiled/picomatch");
  const traced = (route: string, map: Record<string, string[]>) =>
    Object.entries(map).flatMap(([glob, files]) => (picomatch(glob, { dot: true, contains: true })(route) ? files : []));
  const entries = walk(APP).filter((f) => /\/(page|route)\.(tsx?|jsx?)$/.test(f)).map((f) => rel(f).replace(/^src\//, "").replace(/\.[jt]sx?$/, ""));
  // /api/products is a function too (the compare table and saved list); the /api/grid lists are static and trace nothing.
  const runtime = [...PRODUCT_PAGES.map((f) => f.replace(/^src\//, "").replace(/\.tsx$/, "")), "app/api/products/route", "app/admin/page", "app/embed/price/route"];
  for (const e of runtime) assert.ok(entries.includes(e), `${e} exists`);
  // family-cluster.json: CamCompare's camera pages, for the product page's hand-off (lib/family.ts).
  const DATA = [...["catalog.json", "series.json", "store-series.json", "ebay.json"].map((f) => `./data/**/${f}`), "./data/family/family-cluster.json"];
  const EXCLUDED = ["./data/**/archive/**", "./data/**/history/**", "./data/**/raw/**"];
  assert.ok(entries.length > 20, `found ${entries.length} app entries`);
  for (const e of entries) {
    const route = normalizeAppPath(e);
    const inc = traced(route, config.outputFileTracingIncludes);
    if (runtime.includes(e)) assert.deepEqual([...new Set(inc)].sort(), [...DATA].sort(), `${route} must trace the catalogues`);
    // The /api/admin routes match "/admin" too (small routes, a known cost); every other route traces no data.
    else if (/^app\/api\/admin\//.test(e)) assert.ok(inc.every((f) => DATA.includes(f)), route);
    else assert.deepEqual(inc, [], `${route} traces data it doesn't read`);
    assert.deepEqual(traced(route, config.outputFileTracingExcludes).sort(), EXCLUDED, route);
  }
  assert.equal(normalizeAppPath("app/page"), "/app", "the root page's route name");
});

test("nothing a cached page renders reads the request", () => {
  // /api/products is CDN-cached by its URL, so it may read the query string and nothing else.
  const starts = ["src/app/layout.tsx", "src/views/ProductView.tsx", ...PRODUCT_PAGES, "src/app/api/products/route.ts"];
  const seen = new Set<string>();
  const resolve = (from: string, spec: string): string | undefined => {
    const base = spec.startsWith("@/") ? path.join(SRC, spec.slice(2)) : path.resolve(path.dirname(from), spec);
    for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) if (existsSync(c) && statSync(c).isFile()) return c;
    return undefined;
  };
  const queue = starts.map((s) => path.join(ROOT, s));
  while (queue.length) {
    const f = queue.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /next\/headers|\bcookies\(\)|\bheaders\(\)|\bdraftMode\b|admin-auth/, `${rel(f)} reads the request`);
    for (const m of s.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      if (!m[1].startsWith(".") && !m[1].startsWith("@/")) continue;
      const r = resolve(f, m[1]);
      if (r && /\.(ts|tsx)$/.test(r)) queue.push(r);
    }
  }
  assert.ok(seen.size > 20, `walked ${seen.size} files`);
});

test("every link to a product page has prefetch={false}", () => {
  // A prefetched product link is a function invocation each time it scrolls into view.
  const files = sourceFiles.filter((f) => /^src\/(components|views|app)\//.test(rel(f)) && f.endsWith(".tsx"));
  let n = 0;
  const seen = new Set<string>();
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    // The whole opening tag, which may span lines; "=>" inside handlers doesn't close it.
    for (const m of s.matchAll(/<Link\b(?:=>|[^>])*>/g)) {
      if (!/\.category\}\/\$\{|\b[pr]\.href\b|\b(?:hrefOf|productHref)\(/.test(m[0])) continue;
      n++;
      seen.add(rel(f));
      assert.match(m[0], /prefetch=\{false\}/, `${rel(f)}: ${m[0].slice(0, 120)}`);
    }
  }
  assert.ok(n >= 10, `found ${n} product links`);
  // The compare table builds its links with hrefOf(p) (region prefix included).
  assert.ok(seen.has("src/components/CompareView.tsx"), "CompareView's product links are checked");
});

test("a product route that cannot read its data fails with a 500, not a cached 404", () => {
  // Without the traced files every region is empty and every product URL would be a 404 the CDN keeps for a day.
  const s = read("src/views/ProductView.tsx");
  const i = s.indexOf("if (!phone) {");
  assert.ok(i > 0, "ProductView checks for a missing product");
  const block = s.slice(i, s.indexOf("notFound();", i));
  assert.match(block, /if \(!getProducts\(undefined, region\)\.length\) throw new Error/, "throws before notFound() when the region has no data");
});
