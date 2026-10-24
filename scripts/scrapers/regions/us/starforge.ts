/** Starforge Systems (starforgesystems.com, TX) — Shopify. Prebuilt gaming desktops (product_type "Desktop Computers"). */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-starforge",
  base: "https://www.starforgesystems.com",
  brand: "Starforge",
  exclude: /bundle|pre-order|\bx\b.*edition|gift/i,
  cats: { desktops: { keep: (p) => /^desktop computers$/i.test(p.product_type ?? "") } },
});
