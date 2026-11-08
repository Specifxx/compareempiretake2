// The weekly price-movers video (social/movers/pick.mjs): only clean moves on each site's own basis.
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error plain ESM script, no types
import { sealedMoves, opMoves, rankMoves, valueOn, SITES } from "../social/movers/pick.mjs";

const D = 20760;
const product = (slug: string, productType = "Booster Box") => ({ slug, name: slug, productType, imageUrl: "https://x/i.jpg" });

test("sealed: a week-over-week move needs 3+ stores both days, 10% and US$5, within half and double", () => {
  const h = {
    v: 1, since: D - 20, through: D,
    series: { US: {
      ok: [[D - 10, 10000, 5], [D - 2, 12000, 6]],
      thin: [[D - 10, 10000, 2], [D - 2, 12000, 6]],
      small: [[D - 10, 1000, 5], [D - 2, 1400, 6]],
      double: [[D - 10, 10000, 5], [D - 2, 25000, 6]],
      gone: [[D - 10, 10000, 5], [D - 2, null, 0]],
      pack: [[D - 10, 1000, 5], [D - 2, 2000, 6]],
    } },
  };
  const products = ["ok", "thin", "small", "double", "gone"].map((s) => product(s)).concat(product("pack", "Booster Pack"));
  const got = sealedMoves(h, products, SITES.dex);
  assert.deepEqual(got.moves.map((m: { name: string }) => m.name), ["ok"]);
  assert.equal(got.moves[0].pct, 20);
  assert.equal(got.from, "2026-10-27");
});

test("valueOn: the point that held on the day", () => {
  assert.deepEqual(valueOn([[1, 5, 1], [4, 6, 1]], 3), [1, 5, 1]);
  assert.equal(valueOn([[4, 6, 1]], 3), null);
});

test("op: TCGplayer's 7-day change, no promos, nothing under US$5 or over double", () => {
  const card = (id: number, printing: string) => [id, `c${id}`, `Card ${id}`, "OP01-001", 1, "SR", null, printing, "Red", "Character", 1, 1, null, null, 1];
  const core = { sets: [{ id: 1, code: "OP01" }], cards: [card(1, "standard"), card(2, "promo"), card(3, "standard"), card(4, "standard")] };
  const prices = { at: "2026-11-08T00:00:00Z", ids: [1, 2, 3, 4], prices: [[2000, 0, 0, 25, null, null], [2000, 0, 0, 25, null, null], [400, 0, 0, 30, null, null], [9000, 0, 0, 200, null, null]] };
  const got = opMoves(core, prices, SITES.op);
  assert.deepEqual(got.moves.map((m: { name: string }) => m.name), ["Card 1"]);
  assert.equal(got.moves[0].before, 1600);
});

test("rankMoves: biggest first each way, one per name", () => {
  const m = (name: string, pct: number) => ({ name, pct, after: 1000 });
  const r = rankMoves([m("a", 20), m("a", 40), m("b", 30), m("c", -15), m("d", -50)]);
  assert.deepEqual(r.up.map((x: { name: string; pct: number }) => `${x.name}${x.pct}`), ["a40", "b30"]);
  assert.deepEqual(r.down.map((x: { name: string }) => x.name), ["d", "c"]);
});
