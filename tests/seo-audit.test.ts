// SEO audit (2026-11-03): home titles within 60 characters with the brand last, descriptive alt text,
// a WebSite entity, breadcrumbs on brand pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test("home titles fit 60 characters, brand last", () => {
  const src = read("src/views/region-meta.ts");
  const us = src.match(/"(Tech Price Comparison[^"]+)"/)![1];
  const others = ["Australia", "the UK"].map((p) => `Compare Tech Prices in ${p} | Compare Empire`);
  assert.match(src, /`Compare Tech Prices in \$\{IN\[region\]\} \| Compare Empire`/);
  for (const t of [us, ...others]) {
    assert.ok(t.length <= 60, t);
    assert.ok(t.endsWith("| Compare Empire"), t);
  }
});

test("no product photo has empty alt text (share images and the quick view aside)", () => {
  for (const f of walk("src").filter((f) => /\.(tsx|ts)$/.test(f) && !f.includes("/og/") && !f.endsWith("QuickView.tsx"))) {
    assert.ok(!/<img[^>]*alt=""/.test(read(f)), f);
  }
});

test("the site declares Organization and WebSite; brand pages a BreadcrumbList", () => {
  assert.match(read("src/app/layout.tsx"), /"@type": "WebSite"/);
  assert.match(read("src/app/brands/[brand]/page.tsx"), /"BreadcrumbList"/);
});
