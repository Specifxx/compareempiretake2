/**
 * Firewalla (firewalla.com, USD) — official Shopify store. Firewall routers ("Security Gateway") and Wi-Fi 7 access
 * points; switches, rack mounts, cords and warranties are left out. No product_type and numeric SKUs, so titles decide.
 */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-firewalla",
  base: "https://firewalla.com",
  brand: "Firewalla",
  exclude: /\b(warranty|rack mount|power cord|switch)\b/i,
  cats: { routers: { keep: (_p, t) => /\b(security gateway|access point|firewall)\b/i.test(t) } },
});
