import { test } from "node:test";
import assert from "node:assert/strict";
import { partnerOffers, type AwinOffer } from "../src/lib/partner-offers";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const joined = [
  { id: 3326, name: "Ryman", domains: ["ryman.co.uk"], region: "GB" },
  { id: 1, name: "AU Shop", domains: ["shop.com.au"], region: "AU" },
  { id: 2, name: "Impact Brand", domains: ["brand.com"], region: "GB", link: "https://goto.brand.com/c/7385758/1/2" },
];
const o = (id: number, advertiserId: number, end: string, extra: Partial<AwinOffer> = {}): AwinOffer => ({ id, advertiserId, type: "promotion", title: `t${id}`, description: "", start: "2026-11-01T00:00:00Z", end, regions: "all", ...extra });

test("a partner's live offers show in its own region only, as a tracked sponsored link to its home page", () => {
  const offers = [o(1, 3326, "2026-12-01T00:00:00Z"), o(2, 1, "2026-12-01T00:00:00Z")];
  const uk = partnerOffers("uk", "home", { now: NOW, joined, offers });
  assert.equal(uk.length, 1);
  const u = new URL(uk[0].href);
  assert.equal(u.hostname, "www.awin1.com");
  assert.equal(u.searchParams.get("awinmid"), "3326");
  assert.equal(u.searchParams.get("awinaffid"), "3144410");
  assert.equal(u.searchParams.get("ued"), "https://www.ryman.co.uk/");
  assert.equal(u.searchParams.get("clickref"), "ce-offers-uk-home");
  assert.deepEqual(partnerOffers("us", "home", { now: NOW, joined, offers }), []);
});

test("expired, not started, within a day of ending, Impact brands and stores with no offer are left out; vouchers lead", () => {
  const offers = [
    o(1, 3326, "2026-11-10T00:00:00Z"),
    o(2, 3326, "2026-11-11T06:00:00Z"),
    o(3, 3326, "2026-12-01T00:00:00Z", { start: "2026-11-20T00:00:00Z" }),
    o(4, 3326, "2026-12-05T00:00:00Z"),
    o(5, 3326, "2026-12-09T00:00:00Z", { type: "voucher", code: "SAVE" }),
    o(6, 2, "2026-12-01T00:00:00Z"),
  ];
  const r = partnerOffers("uk", "deals", { now: NOW, joined, offers });
  assert.deepEqual(r[0].offers.map((x) => x.id), [5, 4]);
  assert.equal(r.length, 1);
});
