import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAMILY_SITES, footerSisters } from "../src/lib/family-network";

// The footer (owner, 2026-11-03): no sister-site list, only one link to /network, which lists every site once.
test("footer: no sister list, one plain link to the network page", () => {
  assert.deepEqual(footerSisters("empire"), []);
  const footer = readFileSync("src/components/FooterBody.tsx", "utf8");
  assert.doesNotMatch(footer, /footerSisters|Sister site/);
  assert.match(footer, /href="\/network"/);
  assert.doesNotMatch(footer, /sponsored|nofollow/);
});

test("network page: every site once per cluster, never KaeYoung, labels region-neutral", () => {
  const page = readFileSync("src/app/network/page.tsx", "utf8");
  assert.match(page, /FAMILY_SITES/);
  assert.equal(FAMILY_SITES.length, 13);
  assert.ok(!FAMILY_SITES.some((s) => /kaeyoung/i.test(s.url)));
  for (const s of FAMILY_SITES) assert.doesNotMatch(s.label, /\b(Australian|Aussie|American|British|Canadian)\b/i, s.name);
});
