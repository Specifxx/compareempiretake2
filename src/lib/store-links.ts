/**
 * Every link to a store's own listing goes through `storeLink` (product rows, plan rows, the compare table and the
 * stores list): an Awin advertiser that accepted us gets its tracked deep link (src/lib/awin.ts), everything else is
 * the store's own URL as before. A paid link is rel "sponsored" and says "Paid link"; it never changes the order.
 */
import { awinUrl, clickref } from "./awin";

const STORE_REL = "noopener nofollow";
const PAID_REL = "noopener nofollow sponsored";

export function storeLink(url: string, placement: string): { href: string; rel: string; paid: boolean } {
  const tracked = awinUrl(url, clickref("ce", placement));
  return tracked ? { href: tracked, rel: PAID_REL, paid: true } : { href: url, rel: STORE_REL, paid: false };
}
