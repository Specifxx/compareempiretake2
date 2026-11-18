// Store photos are asked for at the size they are drawn (src/lib/image-size.ts, 2026-11-18).
import assert from "node:assert/strict";
import { test } from "node:test";
import { sized } from "../src/lib/image-size";

test("Shopify photos are asked for at twice the drawn width", () => {
  assert.equal(sized("https://cdn.shopify.com/s/files/1/0024/9803/5810/files/a.jpg?v=1793072117", 220), "https://cdn.shopify.com/s/files/1/0024/9803/5810/files/a.jpg?v=1793072117&width=440");
  assert.equal(sized("https://cdn.shopify.com/s/files/1/x.png?v=1&width=2000&height=2000", 80), "https://cdn.shopify.com/s/files/1/x.png?v=1&width=160");
  assert.equal(sized("https://shop.example.com/cdn/shop/files/a.jpg", 48), "https://shop.example.com/cdn/shop/files/a.jpg?width=96");
});

test("imgix and Contentful get w; every other host is left alone", () => {
  assert.equal(sized("https://plecom.imgix.net/a.jpg?h=900", 220), "https://plecom.imgix.net/a.jpg?w=440");
  assert.equal(sized("https://images.ctfassets.net/x/y/z.png", 220), "https://images.ctfassets.net/x/y/z.png?w=440");
  assert.equal(sized("https://assets.umart.com.au/newsite/images/1.jpg", 220), "https://assets.umart.com.au/newsite/images/1.jpg");
  assert.equal(sized("not a url", 220), "not a url");
  assert.equal(sized(null, 220), "");
});
