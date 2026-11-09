// Navigation (owner, 2026-11-09 audit): the menus' links are in the server HTML, the phone menu opens with search,
// and the category page's breadcrumb ends on the category.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(p, "utf8");

test("the mega menu is always rendered (hidden by CSS until opened), never mounted on click only", () => {
  const h = read("src/components/Header.tsx");
  assert.match(h, /id="mega-menu"/);
  assert.doesNotMatch(h, /\{mega && \(/);
});

test("the phone menu starts with search and lists every department", () => {
  const h = read("src/components/Header.tsx");
  assert.ok(h.indexOf("Search products…") < h.indexOf("departments.map((d) => (\n              <div key={d.name} className=\"border-t"));
});

test("a category page's breadcrumb names the category, and top-brand chips are links in every region", () => {
  const v = read("src/views/CategoryView.tsx");
  assert.match(v, /<span aria-current="page">\{c\.name\}<\/span>/);
  assert.doesNotMatch(v, /<span key=\{b\} className="chip/);
});
