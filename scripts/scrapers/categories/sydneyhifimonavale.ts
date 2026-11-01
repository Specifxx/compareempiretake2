/** Sydney Hi-Fi Mona Vale (sydneyhifimonavale.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 6). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sydneyhifimonavale",
  base: "https://www.sydneyhifimonavale.com.au",
  cats: ["speakers", "soundbars", "headphones"],
  exclude: /package|accessor|in[- ]wall|in[- ]ceiling|\bleft\b|\bright\b|subwoofer|lcr/i,
});
