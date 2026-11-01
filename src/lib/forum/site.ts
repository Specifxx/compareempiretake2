// Compare Empire's forum settings (the rules are in ./core.ts, docs/forum.md).
import type { ForumSite } from "./core";

export const FORUM_SITE: ForumSite = {
  site: "compareempire",
  siteName: "Compare Empire",
  repo: "Specifxx/compareempiretake2",
  hosts: ["compareempire.com", "www.compareempire.com"],
  base: "/forum",
  topic: "tech",
  intro: "Ask what to buy, share deals and talk tech and appliance prices with other shoppers.",
  categories: [
    { key: "what-to-buy", name: "What should I buy?", blurb: "Phones, laptops, TVs, appliances: ask for a recommendation within your budget.", prompts: ["Best phone under $800 right now?", "Which robot vacuum is worth it?"] },
    { key: "deals", name: "Deals & where to buy", blurb: "Good prices you spotted, retailer experiences and price matching.", prompts: ["Best deal you found this week", "Which retailer price-matches best?"] },
    { key: "sales", name: "Sales & Black Friday", blurb: "Big sales, which discounts are real and what to wait for.", prompts: ["Is this Black Friday price actually lower?", "What are you waiting to buy on sale?"] },
    { key: "reviews", name: "Owner reviews", blurb: "What you bought, how it's going, and whether you'd buy it again.", prompts: ["Six months with your new laptop: worth it?", "An appliance you regret buying"] },
    { key: "site", name: "Site feedback", blurb: "Ideas, bugs or a retailer we should add.", prompts: ["A retailer we should compare"] },
  ],
  reserved: ["compare empire"],
};
