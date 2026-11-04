/** GameStop (gamestop.com): its affiliate-network product feed, once `FEED_URL_US_GAMESTOP` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "us-gamestop",
  env: "FEED_URL_US_GAMESTOP",
  currency: "USD",
  cats: ["consoles", "headphones", "monitors", "lego"],
});
