/** Hamleys (hamleys.com): its affiliate-network product feed, once `FEED_URL_UK_HAMLEYS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-hamleys",
  env: "FEED_URL_UK_HAMLEYS",
  currency: "GBP",
  cats: ["lego"],
});
