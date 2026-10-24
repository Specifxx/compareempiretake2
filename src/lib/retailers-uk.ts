import type { Retailer } from "./types";

/** UK stores. Ids start with "uk-"; each has a scraper in scripts/scrapers/regions/uk/<id without prefix>.ts. */
export const UK_RETAILERS: (Retailer & { id: `uk-${string}` })[] = [
  // Retailers
  { id: "uk-box", name: "Box", site: "box.co.uk", color: "#E30613", type: "retailer" },
  { id: "uk-laptopsdirect", name: "Laptops Direct", site: "laptopsdirect.co.uk", color: "#0B5CAB", type: "retailer" },
  { id: "uk-overclockers", name: "Overclockers UK", site: "overclockers.co.uk", color: "#E2001A", type: "retailer" },
  { id: "uk-clove", name: "Clove Technology", site: "clove.co.uk", color: "#108474", type: "retailer" },
  { id: "uk-hughes", name: "Hughes", site: "hughes.co.uk", color: "#E4002B", type: "retailer" },
  { id: "uk-petertyson", name: "Peter Tyson", site: "petertyson.co.uk", color: "#1B1B1B", type: "retailer" },
  { id: "uk-superfi", name: "Superfi", site: "superfi.co.uk", color: "#D4202A", type: "retailer" },
  { id: "uk-thegamecollection", name: "The Game Collection", site: "thegamecollection.net", color: "#F15A24", type: "retailer" },
  // Official brand stores
  { id: "uk-apple", name: "Apple", site: "apple.com/uk", color: "#1D1D1F", type: "official" },
  { id: "uk-samsung", name: "Samsung", site: "samsung.com/uk", color: "#1428A0", type: "official" },
  { id: "uk-dell", name: "Dell", site: "dell.com/en-uk", color: "#007DB8", type: "official" },
  { id: "uk-hp", name: "HP Store", site: "hp.com/gb-en", color: "#0096D6", type: "official" },
  { id: "uk-microsoft", name: "Microsoft Store", site: "microsoft.com/en-gb", color: "#737373", type: "official" },
  { id: "uk-dji", name: "DJI Store", site: "store.dji.com/uk", color: "#1A1A1A", type: "official" },
  { id: "uk-garmin", name: "Garmin", site: "garmin.com/en-GB", color: "#007CC3", type: "official" },
  { id: "uk-bose", name: "Bose", site: "bose.co.uk", color: "#2D2D2D", type: "official" },
  { id: "uk-sonos", name: "Sonos", site: "sonos.com/en-gb", color: "#000000", type: "official" },
  { id: "uk-soundcore", name: "soundcore", site: "uk.soundcore.com", color: "#00A7E1", type: "official" },
  { id: "uk-ecovacs", name: "ECOVACS", site: "ecovacs.com/uk", color: "#1E4B9B", type: "official" },
  { id: "uk-roborock", name: "Roborock", site: "uk.roborock.com", color: "#E60012", type: "official" },
  { id: "uk-eufy", name: "eufy", site: "uk.eufy.com", color: "#005CA9", type: "official" },
];
