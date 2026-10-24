/**
 * Focus Camera (focuscamera.com, Brooklyn NY) — Shopify. Category collections' public products.json, filtered by
 * the store's own product_type. Store-made "Bundle" listings and refurbished/"(Refurbished)" types are dropped.
 * The variant SKU is the manufacturer part number (e.g. Garmin 010-N2695-00), except refurb codes ending "-RB".
 */
import { NOT_NEW, shopifyScrapers, type ShopifyProduct } from "./_shopify";

const t = (p: ShopifyProduct) => p.product_type ?? "";
const noBundle = (p: ShopifyProduct) => !/bundle|refurb|accessor|case|protection|warranty/i.test(t(p));

export const scrapers = shopifyScrapers({
  retailer: "us-focuscamera",
  base: "https://www.focuscamera.com",
  skuIsMpn: (s) => (/-RB$/i.test(s) || !/^[A-Z0-9][A-Z0-9-./]{3,}$/i.test(s) ? undefined : s),
  exclude: /\b(bundle|kosher|refurbished)\b|\bwith\b.*\b(kit|charger|case|card|bag|tripod|filter|batter(y|ies)|locator|cleaning|cloth|stand|software|mouse|backpack|sleeve|hub)\b/i,
  cats: {
    cameras: {
      collections: ["mirrorless-cameras", "point-shoot-cameras", "action-cameras"],
      keep: (p) => noBundle(p) && /camera/i.test(t(p)) && !/cinema|chronograph|gimbal|streaming|trail/i.test(t(p)),
    },
    drones: { collections: ["drones"], keep: (p) => noBundle(p) && /drone/i.test(t(p)) && !/fishing|hard case/i.test(t(p)) },
    headphones: {
      collections: ["headphones-earbuds"],
      keep: (p) => noBundle(p) && /headphone|earbud/i.test(t(p)),
    },
    speakers: { collections: ["wireless-speakers"], keep: (p) => noBundle(p) && /speaker/i.test(t(p)) && !/subwoofer|karaoke/i.test(t(p)) },
    smartwatches: { collections: ["smartwatches"], keep: (p) => noBundle(p) && /smartwatch/i.test(t(p)) },
    laptops: { collections: ["laptops"], keep: (p) => noBundle(p) && /laptop|chromebook/i.test(t(p)) },
    tablets: { collections: ["computers-tablets"], keep: (p) => noBundle(p) && /^tablet$/i.test(t(p).trim()) },
    desktops: { collections: ["computers-tablets"], keep: (p) => noBundle(p) && /all-in-one pc|desktop/i.test(t(p)) && !NOT_NEW.test(t(p)) },
    monitors: { collections: ["monitors"], keep: (p) => noBundle(p) && /monitor/i.test(t(p)) && !/production|field|recorder|commercial/i.test(t(p)) },
  },
});
