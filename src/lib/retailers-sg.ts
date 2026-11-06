import type { Retailer } from "./types";

/**
 * Singapore stores (2026-11-06). Ids start with "sg-"; each has a scraper in scripts/scrapers/regions/sg/<id without prefix>.ts.
 * Only stores that charge in the region's currency, vetted as in docs/stores/canada-singapore.md.
 */
export const SG_RETAILERS: (Retailer & { id: `sg-${string}` })[] = [
];
