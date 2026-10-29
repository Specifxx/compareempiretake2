import type { Metadata } from "next";
import Link from "next/link";
import { GuideCard } from "@/components/GuideCard";
import { getCatalog } from "@/lib/catalog";
import { getGuides, GUIDE_SECTIONS } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tech buying guides for Australia, with live prices",
  description: "Best picks, head-to-head comparisons, which Australian stores are cheapest and how to shop smarter. Every price in every guide is checked each morning.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const guides = getGuides();
  const { retailers } = getCatalog();
  const latest = guides.slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Compare Empire guides",
    url: `${SITE}/guides`,
    mainEntity: { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/guides/${g.slug}`, name: g.title })) },
  };
  return (
    <div className="container-x pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="relative overflow-hidden rounded-3xl border border-line bg-bg-card px-6 py-10 shadow-card sm:px-10 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-save/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="eyebrow">Compare Empire guides</div>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">Buy the right thing, from the right store</h1>
          <p className="mt-4 text-lg text-ink-soft">
            {guides.length} guides for Australian shoppers. Every price, ranking and store comparison in them is recalculated each morning from {retailers.length} stores, so nothing here is months out of date.
          </p>
        </div>
        <nav className="relative mt-8 flex flex-wrap gap-2" aria-label="Guide sections">
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
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Latest</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((g, i) => <GuideCard key={g.slug} g={g} eager={i < 3} />)}
        </div>
      </section>

      {GUIDE_SECTIONS.map((s) => {
        const list = guides.filter((g) => g.section === s.id);
        if (!list.length) return null;
        return (
          <section key={s.id} id={s.id} className="mt-14 scroll-mt-24">
            <div className="mb-5">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{s.name}</h2>
              <p className="mt-1 text-sm text-ink-mute">{s.blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((g) => <GuideCard key={g.slug} g={g} />)}
            </div>
          </section>
        );
      })}

      <section className="mt-16 rounded-3xl bg-bg-sunk p-6 text-sm text-ink-soft sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink">How these guides are made</h2>
        <p className="mt-2 max-w-3xl">
          We don&apos;t type prices into articles. Each guide pulls today&apos;s lowest in-stock price for every product it names, and the &ldquo;which store is cheapest&rdquo; tables count every product two or more stores sell, every morning. Stores can&apos;t pay to be included or to rank higher. <Link href="/about#how" className="font-medium text-brand hover:underline">More about how we compare</Link>
        </p>
      </section>
    </div>
  );
}
