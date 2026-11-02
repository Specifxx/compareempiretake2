import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryReport } from "../src/lib/price-report";
import type { Phone } from "../src/lib/types";

const offer = (retailer: string, price: number, inStock = true) => ({ retailer, price, inStock, sku: "", title: "", url: "", colour: "" });
const phone = (...variants: ReturnType<typeof offer>[][]) => ({ variants: variants.map((offers, i) => ({ id: `v${i}`, offers })) }) as unknown as Phone;

test("category report: one gap per product, from the variant most stores sell", () => {
  const r = categoryReport([
    phone([offer("a", 80), offer("b", 100), offer("c", 90)], [offer("a", 10), offer("b", 100)]),
    phone([offer("a", 95), offer("b", 100)]),
    phone([offer("a", 50)]),
    phone([offer("a", 50, false), offer("b", 60, false)]),
  ]);
  assert.equal(r.priced, 3);
  assert.equal(r.compared, 2);
  assert.equal(r.stores, 3);
  assert.ok(Math.abs((r.medianGap ?? 0) - 0.125) < 1e-9);
  assert.equal(r.gap10, 0.5);
});
