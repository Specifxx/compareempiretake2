import type { Retailer } from "./types";

/** US stores. Ids start with "us-"; each has a scraper in scripts/scrapers/regions/us/<id without prefix>.ts. */
export const US_RETAILERS: (Retailer & { id: `us-${string}` })[] = [];
