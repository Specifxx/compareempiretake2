/** Bunnings (bunnings.com.au): its affiliate-network product feed, once `FEED_URL_BUNNINGS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../feed";

export const scrapers = feedStore({
  retailer: "bunnings",
  env: "FEED_URL_BUNNINGS",
  currency: "AUD",
  cats: ["bbqs", "vacuums", "coffee-machines", "air-fryers", "small-kitchen", "fridges", "washing-machines", "dishwashers", "robot-vacuums"],
});
