import type { Retailer } from "./types";

/**
 * Canadian stores (2026-11-06). Ids start with "ca-"; each has a scraper in scripts/scrapers/regions/ca/<id without prefix>.ts.
 * Only stores that charge in the region's currency, vetted as in docs/stores/canada-singapore.md.
 */
export const CA_RETAILERS: (Retailer & { id: `ca-${string}` })[] = [
];
