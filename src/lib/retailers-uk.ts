import type { Retailer } from "./types";

/** UK stores. Ids start with "uk-"; each has a scraper in scripts/scrapers/regions/uk/<id without prefix>.ts. */
export const UK_RETAILERS: (Retailer & { id: `uk-${string}` })[] = [];
