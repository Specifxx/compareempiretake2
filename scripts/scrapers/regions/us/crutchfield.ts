/** Crutchfield (crutchfield.com): its affiliate-network product feed, once `FEED_URL_US_CRUTCHFIELD` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-crutchfield",
  env: "FEED_URL_US_CRUTCHFIELD",
  currency: "USD",
  cats: ["tvs", "soundbars", "headphones", "speakers", "cameras", "smartwatches", "phones"],
});
