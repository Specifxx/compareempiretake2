/**
 * The one listing parser the catalogue build and the Amazon ASIN finder share: phones keep their original
 * parser (lib/normalize.ts), every other category uses lib/match.ts. Same parser, same product: an Amazon
 * listing joins a product only when it parses to that product's own group key and variant.
 */
import { parseProduct, type Parsed } from "./match";
import { parseTitle, storageLabel } from "./normalize";
import type { CategoryId, Phone, RawOffer } from "./types";

export function parseListing(o: RawOffer, category: CategoryId): Parsed | null {
  if (category !== "phones") return parseProduct(o, category);
  const p = parseTitle(o.title, { allowNoStorage: o.fromPrice });
  if (!p) return null;
  const label = storageLabel(p.storageGb);
  return { brand: p.brand, model: p.model, key: p.key, colour: p.colour, variant: { id: p.storageGb ? label.toLowerCase() : "", label, storageGb: p.storageGb } };
}

const asRaw = (title: string): RawOffer => ({ retailer: "jbhifi", sku: "", title, url: "", price: 0, inStock: true }) as RawOffer;

/**
 * Whether an Amazon title is this product's variant: it must parse, to a group key one of the product's own
 * store listings parses to, with the same variant id. Anything else (another size, a bundle, an accessory, a
 * title the parser refuses) is no match: a missing Amazon row costs a click, a wrong one costs trust.
 */
export function amazonTitleMatches(p: Pick<Phone, "category" | "variants">, variantId: string, title: string): boolean {
  const a = parseListing(asRaw(title), p.category);
  if (!a || a.variant.id !== variantId) return false;
  const keys = new Set<string>();
  for (const v of p.variants) for (const o of v.offers) if (o.kind !== "plan") {
    const k = parseListing(asRaw(o.title ?? ""), p.category)?.key;
    if (k) keys.add(k);
  }
  return keys.has(a.key);
}
