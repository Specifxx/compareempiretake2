/** Kohl"s (kohls.com): its affiliate-network product feed, once `FEED_URL_US_KOHLS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-kohls",
  env: "FEED_URL_US_KOHLS",
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
    "tvs",
    "hair-care",
    "lego",
  ],
});
