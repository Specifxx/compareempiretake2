/** Amazfit US (us.amazfit.com) — official Shopify store. Smartwatches by product_type; "Giveaway" promo listings dropped. SKU = model code (W2570TY1N). */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-amazfit",
  base: "https://us.amazfit.com",
  brand: "Amazfit",
  skuIsMpn: true,
  exclude: /giveaway|bundle|\+|strap|band\b/i,
  cats: { smartwatches: { keep: (p) => /^smartwatch$/i.test(p.product_type ?? "") } },
});
