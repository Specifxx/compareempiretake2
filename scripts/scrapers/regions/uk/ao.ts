/** AO (ao.com): its affiliate-network product feed, once `FEED_URL_UK_AO` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-ao",
  env: "FEED_URL_UK_AO",
  currency: "GBP",
  cats: ["fridges", "washing-machines", "dishwashers", "vacuums", "robot-vacuums", "air-fryers", "coffee-machines", "small-kitchen", "tvs", "soundbars", "headphones", "speakers", "bbqs", "hair-care", "laptops", "phones", "tablets", "smartwatches", "consoles", "monitors", "printers"],
});
