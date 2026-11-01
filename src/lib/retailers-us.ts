import type { Retailer } from "./types";

/** US stores. Ids start with "us-"; each has a scraper in scripts/scrapers/regions/us/<id without prefix>.ts. */
export const US_RETAILERS: (Retailer & { id: `us-${string}` })[] = [
  // Retailers
  { id: "us-abt", name: "Abt", site: "abt.com", color: "#0067B1", type: "retailer" },
  { id: "us-focuscamera", name: "Focus Camera", site: "focuscamera.com", color: "#D71920", type: "retailer" },
  { id: "us-worldwidestereo", name: "World Wide Stereo", site: "worldwidestereo.com", color: "#1B1B1B", type: "retailer" },
  { id: "us-audioadvice", name: "Audio Advice", site: "audioadvice.com", color: "#C8102E", type: "retailer" },
  { id: "us-headphonescom", name: "Headphones.com", site: "headphones.com", color: "#111111", type: "retailer" },
  { id: "us-audio46", name: "Audio46", site: "audio46.com", color: "#E53935", type: "retailer" },
  // Official brand stores
  { id: "us-apple", name: "Apple", site: "apple.com", color: "#1D1D1F", type: "official" },
  { id: "us-dell", name: "Dell", site: "dell.com", color: "#007DB8", type: "official" },
  { id: "us-lg", name: "LG", site: "lg.com/us", color: "#A50034", type: "official" },
  { id: "us-bose", name: "Bose", site: "bose.com", color: "#000000", type: "official" },
  { id: "us-sonos", name: "Sonos", site: "sonos.com", color: "#000000", type: "official" },
  { id: "us-garmin", name: "Garmin", site: "garmin.com", color: "#007CC3", type: "official" },
  { id: "us-nintendo", name: "Nintendo", site: "nintendo.com", color: "#E60012", type: "official" },
  { id: "us-roborock", name: "Roborock", site: "us.roborock.com", color: "#E60012", type: "official" },
  { id: "us-dreame", name: "Dreame", site: "dreametech.com", color: "#1A1A1A", type: "official" },
  { id: "us-ecovacs", name: "ECOVACS", site: "ecovacs.com/us", color: "#004EA2", type: "official" },
  { id: "us-soundcore", name: "soundcore", site: "us.soundcore.com", color: "#00A7E1", type: "official" },
  { id: "us-skullcandy", name: "Skullcandy", site: "skullcandy.com", color: "#000000", type: "official" },
  { id: "us-jlab", name: "JLab", site: "jlabaudio.com", color: "#00B2A9", type: "official" },
  { id: "us-shokz", name: "Shokz", site: "shokz.com", color: "#F15A22", type: "official" },
  { id: "us-amazfit", name: "Amazfit", site: "us.amazfit.com", color: "#000000", type: "official" },
  { id: "us-nzxt", name: "NZXT", site: "nzxt.com", color: "#6E2CF2", type: "official" },
  { id: "us-starforge", name: "Starforge Systems", site: "starforgesystems.com", color: "#5B2EFF", type: "official" },
  { id: "us-maingear", name: "MAINGEAR", site: "maingear.com", color: "#E10600", type: "official" },
  { id: "us-minisforum", name: "MINISFORUM", site: "store.minisforum.com", color: "#1A1A1A", type: "official" },
  { id: "us-gmktec", name: "GMKtec", site: "gmktec.com", color: "#E4002B", type: "official" },
  { id: "us-glinet", name: "GL.iNet", site: "gl-inet.com", color: "#E60012", type: "official" },
  { id: "us-firewalla", name: "Firewalla", site: "firewalla.com", color: "#1F6FEB", type: "official" },
  { id: "us-amplifi", name: "AmpliFi", site: "store.amplifi.com", color: "#0559C9", type: "official" },
];
