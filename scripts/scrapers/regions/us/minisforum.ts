/** MINISFORUM US (store.minisforum.com) — official Shopify store. Mini PCs and workstations (product_type) → desktops; NAS, docks and accessories dropped. Variants for other plugs (EU/AU/UK/JP) dropped. SKU = model code. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-minisforum",
  base: "https://store.minisforum.com",
  brand: "MINISFORUM",
  skuIsMpn: true,
  exclude: /bundle|barebone|gift|\b(EU|AU|UK|JP)( plug)?\s*$/i,
  cats: { desktops: { keep: (p) => /^(mini pc|work station|game mini pc)$/i.test(p.product_type ?? "") } },
});
