/**
 * The one canonical host. compareempire.com redirects (308) to www, so every canonical, sitemap and
 * OG URL uses www: a bare-domain value of NEXT_PUBLIC_SITE_URL is upgraded rather than trusted.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.compareempire.com").replace(/\/$/, "").replace("://compareempire.com", "://www.compareempire.com");
export const SITE_NAME = "Compare Empire";
/** The business inbox: shown on the site, used as Reply-To, and the owner's alert address. */
export const CONTACT_EMAIL = "compareempire@outlook.com";

/**
 * The owner's other price-comparison sites, linked from the footer (owner, 2026-10-27: every site links the whole Compare
 * Empire family). Our own sites, not retailers: plain followed links, never sponsored. `anchor` is the link text, the words a
 * searcher types; the site's name follows it.
 */
export const FAMILY_SITES = [
  { name: "CamCompare", url: "https://www.camcompare.app", anchor: "Camera and lens prices" },
  { name: "RiftCompare", url: "https://riftcompare.com", anchor: "Riftbound card prices" },
  { name: "OP Compare", url: "https://opcompare.app", anchor: "One Piece card prices" },
  { name: "DexCompare", url: "https://www.dexcompare.app", anchor: "Pokémon sealed prices" },
  { name: "MTG Compare", url: "https://mtgcompare.app", anchor: "Magic: The Gathering sealed prices" },
  { name: "Gundam Compare", url: "https://gundamcompare.com", anchor: "Gundam Card Game prices" },
  { name: "Lorcana Compare", url: "https://lorcanacompare.com", anchor: "Disney Lorcana card prices" },
  { name: "YGO Compare", url: "https://ygocompare.com", anchor: "Yu-Gi-Oh! card prices" },
] as const;
