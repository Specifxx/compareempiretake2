/** Canadian Tire (canadiantire.ca): its affiliate-network product feed, once `FEED_URL_CA_CANADIANTIRE` exists (docs/stores/big-stores.md, docs/stores/canada-singapore.md). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "ca-canadiantire",
  env: "FEED_URL_CA_CANADIANTIRE",
  currency: "CAD",
  cats: ["phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "tvs", "soundbars", "headphones", "speakers", "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "small-kitchen", "hair-care", "lego", "fridges", "washing-machines", "dishwashers", "bbqs"],
});
