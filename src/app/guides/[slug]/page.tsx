import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/GuideBody";
import { GuideCard } from "@/components/GuideCard";
import { getCatalog, getProducts } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { getGuide, getGuides, GUIDE_SECTIONS, guideHero, guideToc, relatedGuides } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getGuides().map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  const img = guideHero(g)?.image;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, images: img ? [{ url: img }] : undefined },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const { updatedAt } = getCatalog();
  const checked = new Date(updatedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "long", year: "numeric" });
  const toc = guideToc(g);
  const more = relatedGuides(g, 6);
  const section = GUIDE_SECTIONS.find((s) => s.id === g.section)!;
  const cat = categoryById(g.category);
  const catCount = cat ? getProducts(cat.id as CategoryId).length : 0;
  const hero = guideHero(g);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      datePublished: g.date,
      dateModified: updatedAt.slice(0, 10),
      image: hero?.image ? [hero.image] : undefined,
      author: { "@type": "Organization", name: "Compare Empire", url: `${SITE}/about` },
      publisher: { "@type": "Organization", name: "Compare Empire", url: SITE },
      mainEntityOfPage: `${SITE}/guides/${g.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE}/guides` },
        { "@type": "ListItem", position: 2, name: section.name, item: `${SITE}/guides#${section.id}` },
        { "@type": "ListItem", position: 3, name: g.title, item: `${SITE}/guides/${g.slug}` },
      ],
    },
  ];
  return (
    <div className="container-x pt-8 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
        <article className="min-w-0 max-w-3xl">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-ink-mute">
            <Link href="/guides" className="hover:text-ink">Guides</Link>
            <span aria-hidden>/</span>
            <Link href={`/guides#${section.id}`} className="hover:text-ink">{section.name}</Link>
          </nav>
          <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem]">{g.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{g.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line pb-6 text-sm text-ink-mute">
            <span>By the Compare Empire team</span>
            <span>{g.readingMinutes} min read</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-save"><span className="h-1.5 w-1.5 rounded-full bg-save" /> Prices checked {checked}</span>
          </div>
          {toc.length >= 3 && (
            <details className="card mt-6 p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">In this guide</summary>
              <ol className="mt-3 space-y-2 text-sm text-ink-soft">
                {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="hover:text-brand">{t.text}</a></li>)}
              </ol>
            </details>
          )}
          <div className="mt-8">
            <GuideBody body={g.body} />
          </div>
          <div className="mt-12 rounded-2xl border border-line bg-bg-sunk p-5 text-sm text-ink-soft">
            <b className="text-ink">How we work:</b> every price in this guide is today&apos;s lowest in-stock price across the Australian stores we check, refreshed every morning, and the tables recalculate with it. Nobody pays to be included or to rank higher. Specs come from the stores&apos; and makers&apos; own listings.{" "}
            <Link href="/about#how" className="text-brand hover:underline">How Compare Empire works</Link>
          </div>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            {toc.length >= 3 && (
              <nav className="card p-5">
                <div className="eyebrow">In this guide</div>
                <ol className="mt-3 space-y-2.5 text-sm text-ink-soft">
                  {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block leading-snug hover:text-brand">{t.text}</a></li>)}
                </ol>
              </nav>
            )}
            {cat && catCount > 0 && (
              <Link href={cat.href} className="card block bg-gradient-to-br from-brand-soft to-bg-card p-5 transition hover:shadow-lift">
                <div className="text-2xl">{cat.emoji}</div>
                <div className="mt-2 font-display text-lg font-bold leading-snug">Compare every {cat.noun} price</div>
                <p className="mt-1 text-sm text-ink-soft">{catCount.toLocaleString("en-AU")} products in {cat.name} across Australian stores, cheapest in stock first.</p>
                <span className="btn-primary mt-4 w-full py-2 text-xs">Compare {cat.name}</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Keep reading</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => <GuideCard key={m.slug} g={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
