/** Richer Sounds (richersounds.com): its affiliate-network product feed, once `FEED_URL_UK_RICHERSOUNDS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-richersounds",
  env: "FEED_URL_UK_RICHERSOUNDS",
  currency: "GBP",
  cats: ["tvs", "soundbars", "headphones", "speakers"],
});
