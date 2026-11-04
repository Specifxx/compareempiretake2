/** David Jones (davidjones.com): its affiliate-network product feed, once `FEED_URL_DAVIDJONES` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../feed";

export const scrapers = feedStore({
  retailer: "davidjones",
  env: "FEED_URL_DAVIDJONES",
  currency: "AUD",
  cats: ["fridges", "washing-machines", "dishwashers", "vacuums", "robot-vacuums", "air-fryers", "coffee-machines", "small-kitchen", "tvs", "soundbars", "headphones", "speakers", "bbqs", "hair-care", "phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "lego"],
});
