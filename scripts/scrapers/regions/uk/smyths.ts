/** Smyths Toys (smythstoys.com): its affiliate-network product feed, once `FEED_URL_UK_SMYTHS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-smyths",
  env: "FEED_URL_UK_SMYTHS",
  currency: "GBP",
  cats: ["lego", "consoles", "tablets", "headphones", "smartwatches", "cameras"],
});
