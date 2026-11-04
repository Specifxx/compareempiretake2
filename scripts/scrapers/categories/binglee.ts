/** Bing Lee (binglee.com.au): its affiliate-network product feed, once `FEED_URL_BINGLEE` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../feed";

export const scrapers = feedStore({
  retailer: "binglee",
  env: "FEED_URL_BINGLEE",
  currency: "AUD",
  cats: ["phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "tvs", "soundbars", "headphones", "speakers", "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "small-kitchen", "hair-care", "lego", "fridges", "washing-machines", "dishwashers", "bbqs"],
});
