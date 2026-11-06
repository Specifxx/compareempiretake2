import type { Retailer } from "./types";

/**
 * Canadian stores (2026-11-06). Ids start with "ca-"; each has a scraper in scripts/scrapers/regions/ca/<id without prefix>.ts.
 * Only stores that charge in the region's currency, vetted as in docs/stores/canada-singapore.md.
 */
export const CA_RETAILERS: (Retailer & { id: `ca-${string}` })[] = [
  // The big chains: affiliate-network feeds, live once each FEED_URL_* secret exists (docs/stores/canada-singapore.md)
  { id: "ca-bestbuy", name: "Best Buy", site: "bestbuy.ca", color: "#0046BE", type: "retailer" },
  { id: "ca-walmart", name: "Walmart", site: "walmart.ca", color: "#0071CE", type: "retailer" },
  { id: "ca-staples", name: "Staples", site: "staples.ca", color: "#CC0000", type: "retailer" },
  { id: "ca-canadiantire", name: "Canadian Tire", site: "canadiantire.ca", color: "#D52B1E", type: "retailer" },
  { id: "ca-newegg", name: "Newegg", site: "newegg.ca", color: "#F7A51C", type: "retailer" },
  { id: "ca-londondrugs", name: "London Drugs", site: "londondrugs.com", color: "#003DA5", type: "retailer" },
  { id: "ca-visions", name: "Visions Electronics", site: "visions.ca", color: "#E31837", type: "retailer" },
  { id: "ca-costco", name: "Costco", site: "costco.ca", color: "#005DAA", type: "retailer" },
  { id: "ca-homedepot", name: "The Home Depot", site: "homedepot.ca", color: "#F96302", type: "retailer" },
  { id: "ca-thebrick", name: "The Brick", site: "thebrick.com", color: "#D71920", type: "retailer" },
  { id: "ca-leons", name: "Leon's", site: "leons.ca", color: "#E2231A", type: "retailer" },
  // Read directly (store survey 2026-11-06, docs/stores/canada-singapore.md)
  { id: "ca-shokz", name: "Shokz", site: "ca.shokz.com", color: "#1A1A1A", type: "official" },
  { id: "ca-soundcore", name: "soundcore", site: "ca.soundcore.com", color: "#00A7E1", type: "official" },
  { id: "ca-roborock", name: "Roborock", site: "ca.roborock.com", color: "#1A1A1A", type: "official" },
  { id: "ca-narwal", name: "Narwal", site: "ca.narwal.com", color: "#333333", type: "official" },
  { id: "ca-dreame", name: "Dreame", site: "ca.dreametech.com", color: "#1A1A1A", type: "official" },
  { id: "ca-sennheiser", name: "Sennheiser", site: "ca.sennheiser-hearing.com", color: "#0A0A0A", type: "official" },
  { id: "ca-hyperx", name: "HyperX", site: "ca.hyperx.com", color: "#E21836", type: "official" },
  { id: "ca-ooni", name: "Ooni", site: "ca.ooni.com", color: "#E8462B", type: "official" },
  { id: "ca-thecamerastore", name: "The Camera Store", site: "thecamerastore.com", color: "#C8102E", type: "retailer" },
  { id: "ca-gosselin", name: "Gosselin", site: "gosselinphoto.ca", color: "#333333", type: "retailer" },
  { id: "ca-audioexcellence", name: "Audio Excellence", site: "audioexcellence.ca", color: "#333333", type: "retailer" },
  { id: "ca-idrinkcoffee", name: "iDrinkCoffee", site: "idrinkcoffee.com", color: "#D2232A", type: "retailer" },
  { id: "ca-eightounce", name: "Eight Ounce Coffee", site: "eightouncecoffee.ca", color: "#333333", type: "retailer" },
  { id: "ca-espressoplanet", name: "Espresso Planet", site: "espressoplanet.com", color: "#333333", type: "retailer" },
  { id: "ca-anthonys", name: "Anthony's Espresso", site: "anthonysespresso.com", color: "#333333", type: "retailer" },
  { id: "ca-consiglios", name: "Consiglio's Kitchenware", site: "consiglioskitchenware.com", color: "#333333", type: "retailer" },
  { id: "ca-homecoffeesolutions", name: "Home Coffee Solutions", site: "homecoffeesolutions.com", color: "#333333", type: "retailer" },
  { id: "ca-coffeeaddicts", name: "Coffee Addicts", site: "coffeeaddicts.ca", color: "#333333", type: "retailer" },
  { id: "ca-espressodolce", name: "Espresso Dolce", site: "espressodolce.ca", color: "#333333", type: "retailer" },
  { id: "ca-appliancecanada", name: "Appliance Canada", site: "appliancecanada.com", color: "#333333", type: "retailer" },
  { id: "ca-mastermind", name: "Mastermind Toys", site: "mastermindtoys.com", color: "#E4002B", type: "retailer" },
];
