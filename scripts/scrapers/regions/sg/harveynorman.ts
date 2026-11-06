/** Harvey Norman Singapore (harveynorman.com.sg): its affiliate-network product feed, once `FEED_URL_SG_HARVEYNORMAN` exists (docs/stores/big-stores.md, docs/stores/canada-singapore.md). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "sg-harveynorman",
  env: "FEED_URL_SG_HARVEYNORMAN",
  currency: "SGD",
  cats: ["phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "tvs", "soundbars", "headphones", "speakers", "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "small-kitchen", "hair-care", "lego", "fridges", "washing-machines", "dishwashers", "bbqs"],
});
