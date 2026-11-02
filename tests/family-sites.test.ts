import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAMILY_SITES, footerSisters } from "../src/lib/family-network";

// The footer (owner, 2026-11-02: the old eleven-site list was "convoluted"): our own cluster (CamCompare)
// by name, plus one link to /network, which lists every site once (DECISIONS.md "Sites that grow each other").
test("footer: the tech sister and the network page, plain followed links", () => {
  assert.deepEqual(footerSisters("empire").map((s) => s.id), ["cam"]);
  const footer = readFileSync("src/components/FooterBody.tsx", "utf8");
  assert.match(footer, /footerSisters\("empire"\)/);
  assert.match(footer, /href="\/network"/);
  assert.doesNotMatch(footer, /sponsored|nofollow/);
});

test("network page: every site once per cluster, never KaeYoung, labels region-neutral", () => {
  const page = readFileSync("src/app/network/page.tsx", "utf8");
  assert.match(page, /FAMILY_SITES/);
  assert.equal(FAMILY_SITES.length, 12);
  assert.ok(!FAMILY_SITES.some((s) => /kaeyoung/i.test(s.url)));
  for (const s of FAMILY_SITES) assert.doesNotMatch(s.label, /\b(Australian|Aussie|American|British|Canadian)\b/i, s.name);
});
