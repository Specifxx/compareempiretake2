/** Lowe"s (lowes.com): its affiliate-network product feed, once `FEED_URL_US_LOWES` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-lowes",
  env: "FEED_URL_US_LOWES",
  currency: "USD",
  cats: ["fridges", "washing-machines", "dishwashers", "vacuums", "robot-vacuums", "air-fryers", "coffee-machines", "small-kitchen", "tvs", "soundbars", "headphones", "speakers", "bbqs", "hair-care"],
});
