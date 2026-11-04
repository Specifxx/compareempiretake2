/** Wayfair (wayfair.com): its affiliate-network product feed, once `FEED_URL_US_WAYFAIR` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-wayfair",
  env: "FEED_URL_US_WAYFAIR",
  currency: "USD",
  cats: [
    "fridges",
    "washing-machines",
    "dishwashers",
    "air-fryers",
    "small-kitchen",
    "coffee-machines",
    "vacuums",
    "robot-vacuums",
    "bbqs",
  ],
});
