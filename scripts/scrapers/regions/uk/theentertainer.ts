/** The Entertainer (thetoyshop.com): its affiliate-network product feed, once `FEED_URL_UK_THEENTERTAINER` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-theentertainer",
  env: "FEED_URL_UK_THEENTERTAINER",
  currency: "GBP",
  cats: ["lego"],
});
