// The Amazon row's button is amber (owner, 2026-11-18) and the quick view carries a real "See full page" button.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

test(".btn-amazon is amber with dark ink in both themes", () => {
  assert.match(read("src/app/globals.css"), /\.btn-amazon \{ @apply border border-\[#e08a00\] bg-\[#ffa41c\] text-\[#111111\] hover:bg-\[#fa8900\]; \}/);
});

test("the Amazon row's button (priced and Check Amazon) and the compare-table button use .btn-amazon, rel unchanged", () => {
  const src = read("src/components/AmazonLink.tsx");
  assert.equal((src.match(/className="btn-amazon |className=\{`btn-amazon /g) ?? []).length, 2);
  assert.doesNotMatch(src, /rounded-xl bg-brand/);
  assert.equal((src.match(/rel=\{AMAZON_REL\}/g) ?? []).length, 2);
  assert.match(src, /Ad · Paid link/);
  assert.match(src, /View on Amazon/);
  assert.match(src, /Check Amazon/);
});

test("the quick view has a prominent See full page button", () => {
  const src = read("src/components/QuickView.tsx");
  assert.match(src, /data-quickview-fullpage className="btn-primary flex min-h-11 w-full/);
  assert.match(src, /See full page: price history and details/);
});
