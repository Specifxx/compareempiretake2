/** Robert Dyas (robertdyas.co.uk): its affiliate-network product feed, once `FEED_URL_UK_ROBERTDYAS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-robertdyas",
  env: "FEED_URL_UK_ROBERTDYAS",
  currency: "GBP",
  cats: [
    "air-fryers",
    "small-kitchen",
    "coffee-machines",
    "vacuums",
    "robot-vacuums",
    "fridges",
    "washing-machines",
    "dishwashers",
    "bbqs",
    "hair-care",
  ],
});
