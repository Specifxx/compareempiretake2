import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LINK_GROUPS, tagged } from "../src/lib/instagram-links";

test("Instagram link page: tagged https links, never KaeYoung, noindex", () => {
  const all = LINK_GROUPS.flatMap((g) => g.links);
  assert.ok(all.length >= 10);
  assert.equal(new Set(all.map((l) => l.url)).size, all.length);
  for (const l of all) {
    assert.match(l.url, /^https:\/\/[^/]+$/, l.name);
    assert.doesNotMatch(l.url, /kaeyoung/i);
    const u = new URL(tagged(l.url));
    assert.equal(u.searchParams.get("utm_source"), "instagram");
  }
  const page = readFileSync("src/app/links/page.tsx", "utf8");
  assert.match(page, /index: false/);
});
