import Link from "next/link";
import type { Deal } from "@/lib/catalog";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { FlameIcon, TrendDown } from "./icons";
import { RetailerDot } from "./RetailerChip";
import { money, withRegion } from "@/lib/region";

export function DealCard({ d, rank }: { d: Deal; rank?: number }) {
  return (
    <Link href={`${withRegion(`/${d.phone.category}/${d.phone.slug}`, d.phone.region ?? "au")}?v=${d.variant.id}`} className="card group flex gap-4 p-3 transition hover:shadow-lift sm:p-4">
      <div className="img-tile relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl sm:h-28 sm:w-28">
        {d.offer.image || d.phone.image ? (
          <img src={d.offer.image ?? d.phone.image} alt={d.phone.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />
        ) : null}
        {rank !== undefined && rank < 3 && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-hot px-1.5 py-0.5 text-[10px] font-bold text-white">
            <FlameIcon className="h-3 w-3" /> Hot
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-save">
          {d.kind === "drop" && <TrendDown className="h-3.5 w-3.5" />}
          {d.label}
        </div>
        <h3 className="mt-0.5 line-clamp-1 font-semibold">
          {d.phone.name} <span className="font-normal text-ink-mute">{storageLabel(d.variant.storageGb)}</span>
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-mute">
          <RetailerDot id={d.offer.retailer} className="h-2 w-2" /> {RETAILERS[d.offer.retailer].name}
          {d.offer.colour && <span className="truncate">· {d.offer.colour}</span>}
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="price text-xl">{money(d.offer.price, d.phone.region)}</span>
          <span className="text-sm text-ink-mute line-through">{money(Math.round(d.reference), d.phone.region)}</span>
          <span className="ml-auto rounded-lg bg-save-soft px-2 py-0.5 text-xs font-bold text-save">−{d.percent}%</span>
        </div>
      </div>
    </Link>
  );
}
