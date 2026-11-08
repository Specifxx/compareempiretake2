// The Instagram link-in-bio list (owner, 2026-11-08), shown at /links. A site goes here only once its domain is live.
// KaeYoung stands alone and is never listed (DECISIONS.md).
export type BioLink = { name: string; what: string; url: string; color: string };
export type BioGroup = { title: string; links: BioLink[] };

export const LINK_GROUPS: BioGroup[] = [
  {
    title: "Trading cards",
    links: [
      { name: "DexCompare", what: "Pokémon sealed prices", url: "https://dexcompare.app", color: "#f5c400" },
      { name: "RiftCompare", what: "Riftbound card prices", url: "https://riftcompare.com", color: "#d98a2b" },
      { name: "OP Compare", what: "One Piece card prices", url: "https://opcompare.app", color: "#d6363b" },
      { name: "MTG Compare", what: "Magic: The Gathering sealed", url: "https://mtgcompare.app", color: "#e8743b" },
      { name: "Lorcana Compare", what: "Disney Lorcana prices", url: "https://lorcanacompare.com", color: "#4f7cff" },
      { name: "YGO Compare", what: "Yu-Gi-Oh! sealed prices", url: "https://ygocompare.com", color: "#9b59ff" },
      { name: "Gundam Compare", what: "Gundam cards and Gunpla", url: "https://gundamcompare.com", color: "#2f6fd6" },
      { name: "BandaiCompare", what: "Union Arena, Fusion World, Digimon", url: "https://bandaicompare.com", color: "#ff7a1a" },
      { name: "Cyberpunk Compare", what: "Cyberpunk TCG prices", url: "https://cyberpunkcompare.com", color: "#f2e600" },
    ],
  },
  {
    title: "Hobby",
    links: [
      { name: "WargameCompare", what: "Miniature wargame prices", url: "https://wargamecompare.com", color: "#b33a3a" },
      { name: "FigureCompare", what: "Anime figure prices", url: "https://figurecompare.com", color: "#e0245e" },
    ],
  },
  {
    title: "Tech and more",
    links: [
      { name: "Compare Empire", what: "Tech and appliance prices", url: "https://compareempire.com", color: "#5b3df5" },
      { name: "CamCompare", what: "Camera and lens prices", url: "https://www.camcompare.app", color: "#1f9d74" },
      { name: "ScentCompare", what: "Perfume and cologne prices", url: "https://scentcompare.app", color: "#2a5bd7" },
    ],
  },
];

export function tagged(url: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "instagram");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", "bio");
  return u.toString();
}

