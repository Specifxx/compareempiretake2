import type { Metadata } from "next";
import { SearchBox } from "@/components/SearchBox";
import { SearchResults } from "@/components/SearchResults";
import { comparedCategories, liveRegions } from "@/lib/catalog";

// /search?q=… (owner, 2026-11-10, plan B; DECISIONS.md 2026-11-10): one static page; the results are a client island
// that reads ?q= and asks /api/search. Neutral (no region prefix), noindex, out of the sitemap, and robots already
// keeps crawlers off query URLs (/*?).
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Search every Compare Empire site",
  description: "Search prices across Compare Empire and its sister sites: tech, appliances, trading cards, sealed product, figures and wargames.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default function Page() {
  // Ways in for a search nothing answered (2026-11-14): each region's own category pages, which already exist.
  const ways = Object.fromEntries(liveRegions().map((r) => [r, comparedCategories(r).map((c) => ({ id: c.id, name: c.name }))]));
  return (
    <div className="container-x max-w-3xl pt-6 pb-16 sm:pt-10">
      <div className="eyebrow">Search everything</div>
      <h1 className="mt-2 page-title">Search every Compare Empire site</h1>
      <p className="page-lede">Tech and appliances here, plus Pokémon, Magic, Yu-Gi-Oh!, Lorcana, Gundam and sports card sealed product, anime figures and wargames on our sister sites. Each country’s own stores, in its own currency.</p>
      <div className="mt-5">
        <SearchBox size="lg" />
      </div>
      <SearchResults ways={ways} />
    </div>
  );
}
