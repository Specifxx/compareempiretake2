import type { Metadata } from "next";
import Link from "next/link";
import { GuideCard } from "@/components/GuideCard";
import { activeRetailers, liveRegions } from "@/lib/catalog";
import { REGIONS } from "@/lib/region";
import { getGuides, GUIDE_SECTIONS } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tech buying guides with live prices",
  description: "Best picks, buying advice and how to shop smarter, with live prices from the stores in your country (US, UK, Australia and more), checked each morning.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const guides = getGuides();
  const ORDER = ["us", "uk", "au", "ca", "sg"];
  const regions = liveRegions().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const stores = regions.reduce((n, r) => n + activeRetailers(undefined, r).length, 0);
  const names = regions.map((r) => (r === "us" || r === "uk" ? `the ${r.toUpperCase()}` : REGIONS[r].name));
  const where = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  const latest = guides.slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Compare Empire guides",
    url: `${SITE}/guides`,
    mainEntity: { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/guides/${g.slug}`, name: g.title })) },
  };
  return (
    <div className="container-x pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* The shared page header (2026-11-14): no card or colour wash, the same h1 and words. */}
      <header>
        <div className="max-w-2xl">
          <div className="eyebrow">Compare Empire guides</div>
          <h1 className="page-title mt-2">Buy the right thing, from the right store</h1>
          <p className="page-lede">
            {guides.length} guides for shoppers in {where}. Every price, ranking and store comparison in them is shown in your own currency and recalculated each morning from {stores.toLocaleString("en-US")} stores, so nothing here is months out of date.
          </p>
        </div>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Guide sections">
          {GUIDE_SECTIONS.map((s) => {
            const n = guides.filter((g) => g.section === s.id).length;
            return n ? (
              <a key={s.id} href={`#${s.id}`} className="chip">
                {s.name} <span className="text-ink-mute">{n}</span>
              </a>
            ) : null;
          })}
        </nav>
      </header>

      <section className="mt-10">
        <h2 className="section-title mb-3.5">Latest</h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {latest.map((g, i) => <GuideCard key={g.slug} g={g} eager={i < 3} />)}
        </div>
      </section>

      {GUIDE_SECTIONS.map((s) => {
        const list = guides.filter((g) => g.section === s.id);
        if (!list.length) return null;
        return (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-32">
            <div className="mb-3.5">
              <h2 className="section-title">{s.name}</h2>
              <p className="mt-0.5 text-sm text-ink-mute">{s.blurb}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {list.map((g) => <GuideCard key={g.slug} g={g} />)}
            </div>
          </section>
        );
      })}

      <section className="mt-12 rounded-lg border border-line bg-bg-card p-5 text-sm leading-relaxed text-ink-soft sm:p-6">
        <h2 className="text-base font-bold text-ink">How these guides are made</h2>
        <p className="mt-2 max-w-3xl">
          We don&apos;t type prices into articles. Each guide pulls today&apos;s lowest in-stock price for every product it names, and the &ldquo;which store is cheapest&rdquo; tables count every product two or more stores sell, every morning. Stores can&apos;t pay to be included or to rank higher. <Link prefetch={false} href="/about#how" className="font-medium text-brand hover:underline">More about how we compare</Link>
        </p>
      </section>
    </div>
  );
}
