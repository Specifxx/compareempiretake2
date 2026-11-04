/** Target Australia (target.com.au): its affiliate-network product feed, once `FEED_URL_TARGETAU` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../feed";

export const scrapers = feedStore({
  retailer: "targetau",
  env: "FEED_URL_TARGETAU",
  currency: "AUD",
  cats: ["phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "tvs", "soundbars", "headphones", "speakers", "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "small-kitchen", "hair-care", "lego", "bbqs", "fridges", "washing-machines", "dishwashers"],
});
