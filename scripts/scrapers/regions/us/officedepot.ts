/** Office Depot (officedepot.com): its affiliate-network product feed, once `FEED_URL_US_OFFICEDEPOT` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-officedepot",
  env: "FEED_URL_US_OFFICEDEPOT",
  currency: "USD",
  cats: [
    "printers",
    "laptops",
    "desktops",
    "monitors",
    "routers",
    "headphones",
    "speakers",
    "tablets",
    "ssds",
    "ram",
  ],
});
