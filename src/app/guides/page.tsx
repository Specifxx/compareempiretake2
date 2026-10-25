import type { Metadata } from "next";
import Link from "next/link";
import { getPhone, getProduct } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { getGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides — best phones, comparisons and buying advice",
  description: "Buying guides with live Australian prices: the best phones at every budget, head-to-head comparisons, and how to spot a fake sale.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const guides = getGuides();
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Guides</h1>
      <p className="mt-2 max-w-xl text-ink-mute">Buying advice where every price is live — pulled from today&apos;s check of every store, not typed in months ago.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((g, i) => {
          const hero = g.hero ? (g.hero.includes("/") ? getProduct(g.hero.split("/")[0] as CategoryId, g.hero.split("/")[1]) : getPhone(g.hero)) : undefined;
          return (
            <Link key={g.slug} href={`/guides/${g.slug}`} className={`card group flex flex-col overflow-hidden transition hover:shadow-lift ${i === 0 ? "md:col-span-2 lg:col-span-2" : ""}`}>
              <div className={`img-tile relative ${i === 0 ? "aspect-[2/1]" : "aspect-[16/9]"}`}>
                {hero?.image && <img src={hero.image} alt="" className="product-img absolute inset-0 h-full w-full object-contain p-6 transition group-hover:scale-[1.03]" loading={i < 3 ? "eager" : "lazy"} />}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="eyebrow">{g.tags[0] ?? "Guide"}</div>
                <h2 className={`mt-1.5 font-display font-bold leading-snug ${i === 0 ? "text-2xl" : "text-lg"}`}>{g.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{g.description}</p>
                <div className="mt-auto pt-4 text-xs text-ink-mute">{g.readingMinutes} min read · prices updated daily</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
