import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Front pages feature the dearer products (owner, 2026-11-12; DECISIONS.md "Feature the dearer items").
// lib/catalog.ts imports "server-only": run under the react-server condition, as tests/launches.test.ts does.
const code = `
import { featureFloor, getDeals, getSummaries, ticketWeight } from "./src/lib/catalog.ts";
import { REGION_IDS } from "./src/lib/region.ts";
const mk = (n, price) => Array.from({ length: n }, (_, i) => ({ bestPrice: price(i), retailerCount: 3 }));
const bad = [];
const out = {
  median: featureFloor(mk(9, (i) => (i + 1) * 100)),
  few: featureFloor(mk(5, (i) => (i + 1) * 100)),
  oneStore: featureFloor([...mk(7, () => 100), { bestPrice: 9000, retailerCount: 1 }]),
  heavy: ticketWeight({ bestPrice: 900, retailerCount: 3 }) > ticketWeight({ bestPrice: 300, retailerCount: 9 }),
  capped: ticketWeight({ bestPrice: 100, retailerCount: 9 }),
  bad,
};
for (const region of REGION_IDS) {
  const all = getDeals(500, undefined, region);
  const top = getDeals(500, undefined, region, { pricier: true });
  if (top.length > all.length) bad.push(region + " more");
  const floors = new Map();
  for (const d of top) {
    const c = d.phone.category;
    if (!floors.has(c)) floors.set(c, featureFloor(getSummaries(c, region)));
    if (d.offer.price < floors.get(c)) bad.push(region + " " + d.phone.slug);
  }
}
console.log(JSON.stringify(out));
`;
const out = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 << 20 }).trim().split("\n").pop()!);

test("the floor is the category's own median, and zero when there is too little to judge", () => {
  assert.equal(out.median, 500);
  assert.equal(out.few, 0);
  assert.equal(out.oneStore, 0, "one-store products do not count");
});

test("ticket weight orders by price, then stores, capped at five", () => {
  assert.ok(out.heavy);
  assert.equal(out.capped, 500);
});

test("home deals only feature offers at or above the floor, in every region's real data", () => {
  assert.deepEqual(out.bad, []);
});
