/** BJ"s Wholesale (bjs.com): its affiliate-network product feed, once `FEED_URL_US_BJS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-bjs",
  env: "FEED_URL_US_BJS",
  currency: "USD",
  cats: [
    "tvs",
    "laptops",
    "tablets",
    "headphones",
    "speakers",
    "smartwatches",
    "air-fryers",
    "small-kitchen",
    "coffee-machines",
    "vacuums",
    "robot-vacuums",
    "lego",
    "bbqs",
  ],
});
