import Link from "next/link";
import { categoryById } from "@/lib/categories";
import { GUIDE_SECTIONS, guidePhotos, type Guide } from "@/lib/guides";

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
  const photos = guidePhotos(g);
  const images = photos.map((x) => x.src);
  const cat = categoryById(g.category);
  const section = GUIDE_SECTIONS.find((s) => s.id === g.section);
  const fan = FAN[images.length] ?? [];
  return (
    <Link prefetch={false} href={`/guides/${g.slug}`} className={`card tile-hover group flex flex-col overflow-hidden ${big ? "md:col-span-2" : ""}`}>
      {/* A calm, neutral thumbnail (2026-11-14): the products on a plain sunk panel, like the home page's tiles. */}
      <div className={`relative overflow-hidden border-b border-line bg-bg-sunk ${big ? "aspect-[2/1]" : "aspect-[2/1] sm:aspect-[16/9]"}`}>
        {images.length ? (
          images.map((src, i) => (
            <span
              key={src}
              className="absolute block aspect-square rounded-lg border border-line/70 bg-white p-[3%] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]"
              style={{ left: fan[i].left, top: fan[i].top, width: fan[i].w, transform: `rotate(${fan[i].rot})`, zIndex: fan[i].z }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the stores' own photos, hotlinked */}
              <img src={src} alt={photos[i].alt} className="h-full w-full object-contain" loading={eager && i === 0 ? "eager" : "lazy"} />
            </span>
          ))
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center text-5xl opacity-90 transition group-hover:scale-110">{cat?.emoji ?? "🛒"}</span>
        )}
        {section && <span className="absolute left-3 top-3 z-10 rounded-full border border-line bg-bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-soft">{section.name}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className={`font-bold leading-snug tracking-tight group-hover:text-brand ${big ? "text-2xl" : "text-base sm:text-lg"}`}>{g.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{g.description}</p>
        <div className="mt-auto pt-3 text-xs text-ink-mute">{g.readingMinutes} min read · live prices</div>
      </div>
    </Link>
  );
}
