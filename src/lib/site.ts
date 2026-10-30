/**
 * The one canonical host: the apex, compareempire.com, the host that serves the pages. www was canonical until
 * it lost its DNS record in the 2026-10-26 outage, after which every canonical, sitemap and OG URL pointed at a
 * host that did not resolve (DECISIONS.md, 2026-10-27). A www value of NEXT_PUBLIC_SITE_URL is moved to the apex.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://compareempire.com").replace(/\/$/, "").replace("://www.compareempire.com", "://compareempire.com");
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
  { name: "DexCompare", url: "https://dexcompare.app", anchor: "Pokémon sealed prices" },
  { name: "MTG Compare", url: "https://mtgcompare.app", anchor: "Magic: The Gathering sealed prices" },
  { name: "Gundam Compare", url: "https://gundamcompare.com", anchor: "Gundam Card Game prices" },
  { name: "Lorcana Compare", url: "https://lorcanacompare.com", anchor: "Disney Lorcana card prices" },
  { name: "YGO Compare", url: "https://ygocompare.com", anchor: "Yu-Gi-Oh! card prices" },
  { name: "WargameCompare", url: "https://wargamecompare.com", anchor: "Miniature wargame prices" },
  { name: "FigureCompare", url: "https://figurecompare.com", anchor: "Anime figure prices" },
] as const;
