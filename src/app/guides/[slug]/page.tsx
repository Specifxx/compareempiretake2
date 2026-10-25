import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/GuideBody";
import { getCatalog, getPhone, getProduct } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { getGuide, getGuides } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getGuides().map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  const img = g.hero ? (g.hero.includes("/") ? getProduct(g.hero.split("/")[0] as CategoryId, g.hero.split("/")[1]) : getPhone(g.hero))?.image : undefined;
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
  const more = getGuides().filter((x) => x.slug !== g.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    datePublished: g.date,
    dateModified: updatedAt.slice(0, 10),
    author: { "@type": "Organization", name: "Compare Empire" },
    publisher: { "@type": "Organization", name: "Compare Empire", url: SITE },
    mainEntityOfPage: `${SITE}/guides/${g.slug}`,
  };
  return (
    <article className="container-x max-w-3xl pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-ink-mute"><Link href="/guides" className="hover:text-ink">Guides</Link> / <span className="text-ink">{g.tags[0] ?? "Guide"}</span></nav>
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{g.title}</h1>
      <p className="mt-4 text-lg text-ink-soft">{g.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line pb-6 text-sm text-ink-mute">
        <span>By the Compare Empire team</span>
        <span>{g.readingMinutes} min read</span>
        <span className="inline-flex items-center gap-1.5 text-save"><span className="h-1.5 w-1.5 rounded-full bg-save" /> Prices checked {checked}</span>
      </div>
      <div className="mt-8">
        <GuideBody body={g.body} />
      </div>
      <div className="mt-12 rounded-2xl border border-line bg-bg-sunk p-5 text-sm text-ink-soft">
        <b className="text-ink">How we pick:</b> prices are today&apos;s lowest in-stock price across the stores we check, refreshed every morning. Nobody pays to be included. Specs come from the retailers&apos; own listings.{" "}
        <Link href="/about#how" className="text-brand hover:underline">How Compare Empire works</Link>
      </div>
      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl font-bold">More guides</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {more.map((m) => (
              <Link key={m.slug} href={`/guides/${m.slug}`} className="card p-4 transition hover:shadow-lift">
                <div className="eyebrow">{m.tags[0] ?? "Guide"}</div>
                <div className="mt-1 font-semibold leading-snug">{m.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
