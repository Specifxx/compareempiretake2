/** Marks Electrical (markselectrical.co.uk): its affiliate-network product feed, once `FEED_URL_UK_MARKSELECTRICAL` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-markselectrical",
  env: "FEED_URL_UK_MARKSELECTRICAL",
  currency: "GBP",
  cats: [
    "tvs",
    "soundbars",
    "fridges",
    "washing-machines",
    "dishwashers",
    "vacuums",
    "coffee-machines",
    "air-fryers",
    "small-kitchen",
  ],
});
