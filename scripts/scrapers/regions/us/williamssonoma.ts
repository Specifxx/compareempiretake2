/** Williams Sonoma (williams-sonoma.com): its affiliate-network product feed, once `FEED_URL_US_WILLIAMSSONOMA` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-williamssonoma",
  env: "FEED_URL_US_WILLIAMSSONOMA",
  currency: "USD",
  cats: [
    "coffee-machines",
    "coffee-gear",
    "air-fryers",
    "small-kitchen",
    "bbqs",
  ],
});
