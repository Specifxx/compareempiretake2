/** Macy"s (macys.com): its affiliate-network product feed, once `FEED_URL_US_MACYS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-macys",
  env: "FEED_URL_US_MACYS",
  currency: "USD",
  cats: [
    "air-fryers",
    "small-kitchen",
    "coffee-machines",
    "vacuums",
    "robot-vacuums",
    "headphones",
    "speakers",
    "smartwatches",
    "hair-care",
    "lego",
  ],
});
