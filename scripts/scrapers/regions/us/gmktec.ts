/** GMKtec US (gmktec.com) — official Shopify store. Mini PCs (titles say "Mini PC") → desktops; docks, eGPU boxes and accessories dropped. Variants for other plugs (EU/AU/UK/JP) dropped. SKU = model code. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-gmktec",
  base: "https://www.gmktec.com",
  brand: "GMKtec",
  skuIsMpn: true,
  exclude: /bundle|barebone|dock|egpu|adapter|monitor|keyboard|\b(EU|AU|UK|JP)( plug)?\s*$/i,
  cats: { desktops: { keep: (_p, t) => /mini pc|nucbox|evo-x|workstation/i.test(t) } },
});
