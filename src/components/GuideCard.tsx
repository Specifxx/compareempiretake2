import Link from "next/link";
import { categoryById } from "@/lib/categories";
import { GUIDE_SECTIONS, guideHero, type Guide } from "@/lib/guides";

/** A guide's card on /guides, the home page, category pages and "Keep reading". */
export function GuideCard({ g, big, eager }: { g: Guide; big?: boolean; eager?: boolean }) {
  const hero = guideHero(g);
  const cat = categoryById(g.category);
  const section = GUIDE_SECTIONS.find((s) => s.id === g.section);
  return (
    <Link href={`/guides/${g.slug}`} className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift ${big ? "md:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden ${big ? "aspect-[2/1]" : "aspect-[16/9]"} ${hero?.image ? "img-tile" : "bg-gradient-to-br from-brand-soft via-bg-sunk to-save-soft"}`}>
        {hero?.image ? (
          <img src={hero.image} alt="" className="product-img absolute inset-0 h-full w-full object-contain p-6 transition group-hover:scale-[1.03]" loading={eager ? "eager" : "lazy"} />
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center text-5xl opacity-90 transition group-hover:scale-110">{cat?.emoji ?? "🛒"}</span>
        )}
        {section && <span className="absolute left-3 top-3 rounded-full bg-bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-sm backdrop-blur">{section.name}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={`font-display font-bold leading-snug group-hover:text-brand ${big ? "text-2xl" : "text-lg"}`}>{g.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{g.description}</p>
        <div className="mt-auto pt-4 text-xs text-ink-mute">{g.readingMinutes} min read · live prices</div>
      </div>
    </Link>
  );
}
