/** Ryman (ryman.co.uk): its affiliate-network product feed, once `FEED_URL_UK_RYMAN` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-ryman",
  env: "FEED_URL_UK_RYMAN",
  currency: "GBP",
  cats: [
    "printers",
    "laptops",
    "tablets",
    "monitors",
    "routers",
    "headphones",
    "speakers",
    "ssds",
  ],
});
