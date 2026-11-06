import type { Retailer } from "./types";

/**
 * Singapore stores (2026-11-06). Ids start with "sg-"; each has a scraper in scripts/scrapers/regions/sg/<id without prefix>.ts.
 * Only stores that charge in the region's currency, vetted as in docs/stores/canada-singapore.md.
 */
export const SG_RETAILERS: (Retailer & { id: `sg-${string}` })[] = [
  // The big chains: affiliate-network feeds, live once each FEED_URL_* secret exists (docs/stores/canada-singapore.md)
  { id: "sg-courts", name: "COURTS", site: "courts.com.sg", color: "#E4002B", type: "retailer" },
  { id: "sg-harveynorman", name: "Harvey Norman", site: "harveynorman.com.sg", color: "#005B9C", type: "retailer" },
  { id: "sg-bestdenki", name: "Best Denki", site: "bestdenki.com.sg", color: "#E60012", type: "retailer" },
  { id: "sg-gaincity", name: "Gain City", site: "gaincity.com", color: "#ED1C24", type: "retailer" },
  // Read directly (store survey 2026-11-06, docs/stores/canada-singapore.md)
  { id: "sg-challenger", name: "Challenger", site: "challenger.sg", color: "#F37021", type: "retailer" },
  { id: "sg-megadiscount", name: "Mega Discount Store", site: "megadiscountstore.com.sg", color: "#333333", type: "retailer" },
  { id: "sg-stereo", name: "Stereo", site: "stereo.com.sg", color: "#333333", type: "retailer" },
  { id: "sg-mobilesquare", name: "Mobile Square", site: "mobilesquare.com.sg", color: "#333333", type: "retailer" },
  { id: "sg-gadgetbox", name: "Gadget Box", site: "gadgetbox.sg", color: "#333333", type: "retailer" },
  { id: "sg-sony", name: "Sony Store", site: "store.sony.com.sg", color: "#333333", type: "official" },
  { id: "sg-mscolor", name: "MS Color", site: "mscolor.com.sg", color: "#333333", type: "retailer" },
  { id: "sg-thetechyard", name: "The Tech Yard", site: "thetechyard.com", color: "#333333", type: "retailer" },
  { id: "sg-gameshop", name: "Gameshop", site: "gameshop.sg", color: "#333333", type: "retailer" },
  { id: "sg-commonman", name: "Common Man Coffee Roasters", site: "commonmancoffeeroasters.com", color: "#333333", type: "retailer" },
  { id: "sg-mayer", name: "Mayer", site: "mayer.sg", color: "#333333", type: "official" },
  { id: "sg-toyomi", name: "Toyomi", site: "toyomi.com.sg", color: "#333333", type: "official" },
  { id: "sg-tefal", name: "Tefal", site: "tefal.com.sg", color: "#333333", type: "official" },
  { id: "sg-europace", name: "Europace", site: "europace.com.sg", color: "#333333", type: "official" },
  { id: "sg-shokz", name: "Shokz", site: "sg.shokz.com", color: "#1A1A1A", type: "official" },
  { id: "sg-sennheiser", name: "Sennheiser", site: "sg.sennheiser-hearing.com", color: "#0A0A0A", type: "official" },
  { id: "sg-narwal", name: "Narwal", site: "sg.narwal.com", color: "#333333", type: "official" },
];
