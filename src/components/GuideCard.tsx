import Link from "next/link";
import { categoryById } from "@/lib/categories";
import { GUIDE_SECTIONS, guideImages, type Guide } from "@/lib/guides";

// Fanned photo cards on the thumbnail: the first in front. Positions for one, two and three photos.
const FAN: Record<number, { left: string; top: string; w: string; rot: string; z: number }[]> = {
  1: [{ left: "30%", top: "14%", w: "40%", rot: "-3deg", z: 3 }],
  2: [
    { left: "44%", top: "18%", w: "36%", rot: "4deg", z: 3 },
    { left: "20%", top: "10%", w: "34%", rot: "-6deg", z: 2 },
  ],
  3: [
    { left: "33%", top: "20%", w: "34%", rot: "-2deg", z: 3 },
    { left: "10%", top: "8%", w: "30%", rot: "-9deg", z: 2 },
    { left: "60%", top: "8%", w: "30%", rot: "8deg", z: 1 },
  ],
};

/** A guide's card on /guides, the home page, category pages and "Keep reading". */
export function GuideCard({ g, big, eager }: { g: Guide; big?: boolean; eager?: boolean }) {
  const images = guideImages(g);
  const cat = categoryById(g.category);
  const section = GUIDE_SECTIONS.find((s) => s.id === g.section);
  const fan = FAN[images.length] ?? [];
  return (
    <Link href={`/guides/${g.slug}`} className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift ${big ? "md:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden bg-gradient-to-br from-[#2A1A8C] via-brand to-[#9B4DFF] ${big ? "aspect-[2/1]" : "aspect-[16/9]"}`}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 left-6 h-40 w-40 rounded-full bg-save/30 blur-2xl" />
        {images.length ? (
          images.map((src, i) => (
            <span
              key={src}
              className="absolute block aspect-square rounded-xl bg-white p-[3%] shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              style={{ left: fan[i].left, top: fan[i].top, width: fan[i].w, transform: `rotate(${fan[i].rot})`, zIndex: fan[i].z }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the stores' own photos, hotlinked */}
              <img src={src} alt="" className="h-full w-full object-contain" loading={eager && i === 0 ? "eager" : "lazy"} />
            </span>
          ))
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center text-5xl opacity-90 transition group-hover:scale-110">{cat?.emoji ?? "🛒"}</span>
        )}
        {section && <span className="absolute left-3 top-3 z-10 rounded-full bg-bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-sm backdrop-blur">{section.name}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={`font-display font-bold leading-snug group-hover:text-brand ${big ? "text-2xl" : "text-lg"}`}>{g.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{g.description}</p>
        <div className="mt-auto pt-4 text-xs text-ink-mute">{g.readingMinutes} min read · live prices</div>
      </div>
    </Link>
  );
}
