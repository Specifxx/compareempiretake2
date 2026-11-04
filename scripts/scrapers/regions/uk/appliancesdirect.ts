/** Appliances Direct (appliancesdirect.co.uk): its affiliate-network product feed, once `FEED_URL_UK_APPLIANCESDIRECT` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-appliancesdirect",
  env: "FEED_URL_UK_APPLIANCESDIRECT",
  currency: "GBP",
  cats: [
    "fridges",
    "washing-machines",
    "dishwashers",
    "tvs",
    "vacuums",
    "coffee-machines",
    "air-fryers",
    "small-kitchen",
  ],
});
