/** GAME (game.co.uk): its affiliate-network product feed, once `FEED_URL_UK_GAME` exists (docs/stores/big-stores.md; the site itself walls off every server). */
import { feedStore } from "../../feed";

export const scrapers = feedStore({
  retailer: "uk-game",
  env: "FEED_URL_UK_GAME",
  currency: "GBP",
  cats: ["consoles", "headphones", "monitors", "lego"],
});
