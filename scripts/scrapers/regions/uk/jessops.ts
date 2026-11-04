/** Jessops (jessops.com): its affiliate-network product feed, once `FEED_URL_UK_JESSOPS` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-jessops",
  env: "FEED_URL_UK_JESSOPS",
  currency: "GBP",
  cats: ["cameras", "drones"],
});
