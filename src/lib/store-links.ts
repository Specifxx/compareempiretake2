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

/**
 * The cart list (components/cart, owner 2026-11-06): the Shopify cart permalink of an in-stock listing whose
 * link earns nothing, `<shop>[/<locale>]/cart/<variant>:1`, from the `/products/<handle>?variant=<id>` URL the
 * Shopify reader stores. Null for an Awin store (its tracking runs on its own pages, which a cart skips) and for
 * any URL not in that shape, which stays a manual line with its own link.
 */
export function shopifyCartHref(url: string, inStock: boolean): string | null {
  if (!inStock || awinUrl(url, "x")) return null;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/products\/[^/]+\/?$/i);
    const v = u.searchParams.get("variant");
    if (u.protocol !== "https:" || !m || !v || !/^\d{6,20}$/.test(v)) return null;
    return `${u.origin}${m[1]}/cart/${v}:1`;
  } catch {
    return null;
  }
}
