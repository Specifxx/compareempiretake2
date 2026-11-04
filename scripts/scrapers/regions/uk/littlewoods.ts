/** Littlewoods (littlewoods.com): its affiliate-network product feed, once `FEED_URL_UK_LITTLEWOODS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-littlewoods",
  env: "FEED_URL_UK_LITTLEWOODS",
  currency: "GBP",
  cats: [
    "tvs",
    "laptops",
    "tablets",
    "phones",
    "headphones",
    "speakers",
    "soundbars",
    "smartwatches",
    "consoles",
    "air-fryers",
    "small-kitchen",
    "coffee-machines",
    "vacuums",
    "robot-vacuums",
    "fridges",
    "washing-machines",
    "dishwashers",
    "lego",
    "hair-care",
  ],
});
