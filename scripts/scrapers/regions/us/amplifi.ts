/**
 * AmpliFi (store.amplifi.com, USD) — Ubiquiti's consumer mesh Wi-Fi store on Shopify. Routers and mesh systems by
 * product_type "Wireless" (accessories have their own type); the SKU is the model code ("AFI-ALN-US").
 */
import { shopifyScrapers, type } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-amplifi",
  base: "https://store.amplifi.com",
  brand: "AmpliFi",
  skuIsMpn: true,
  cats: { routers: { keep: type(/^wireless$/i) } },
});
