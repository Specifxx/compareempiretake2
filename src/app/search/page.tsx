import type { Metadata } from "next";
import { SearchBox } from "@/components/SearchBox";
import { SearchResults } from "@/components/SearchResults";

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
  return (
    <div className="container-x max-w-3xl pt-10 pb-16">
      <div className="eyebrow">Search everything</div>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Search every Compare Empire site</h1>
      <p className="mt-2 text-ink-soft">Tech and appliances here, plus Pokémon, Magic, Yu-Gi-Oh!, Lorcana, Gundam and sports card sealed product, anime figures and wargames on our sister sites. Each country’s own stores, in its own currency.</p>
      <div className="mt-5">
        <SearchBox size="lg" />
      </div>
      <SearchResults />
    </div>
  );
}
