import Link from "next/link";
import type { PhoneSummary } from "@/lib/catalog";
import { storageLabel } from "@/lib/normalize";
import { CompareToggle } from "./CompareToggle";
import { SaveButton } from "./SaveButton";

export function PhoneCard({ p, priority }: { p: PhoneSummary; priority?: boolean }) {
  const pct = p.saving > 0 ? Math.round((p.saving / (p.bestPrice + p.saving)) * 100) : 0;
  return (
    <Link href={`/phones/${p.slug}`} className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="img-tile relative aspect-square">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            className="product-img absolute inset-0 h-full w-full object-contain p-6 transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-mute">No image</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {pct >= 5 && <span className="rounded-full bg-save px-2 py-0.5 text-[11px] font-bold text-white">Save ${Math.round(p.saving)}</span>}
          {p.atLowest && <span className="rounded-full bg-hot px-2 py-0.5 text-[11px] font-bold text-white">Lowest price yet</span>}
        </div>
        <SaveButton slug={p.slug} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="text-xs font-medium text-ink-mute">{p.brand}</div>
        <h3 className="line-clamp-2 font-semibold leading-snug">{p.model}</h3>
        <div className="text-xs text-ink-mute">
          {p.storages.length > 1 ? `${storageLabel(p.storages[0])} – ${storageLabel(p.storages.at(-1)!)}` : storageLabel(p.storages[0])}
          {p.foldable && " · Foldable"}
          {p.network === "4G" && " · 4G"}
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="text-[11px] text-ink-mute">from</div>
            <div className="price text-xl">${p.bestPrice.toLocaleString("en-AU")}</div>
          </div>
          <div className="text-right text-xs text-ink-mute">
            <span className="font-semibold text-ink">{p.retailerCount}</span> {p.retailerCount === 1 ? "store" : "stores"}
          </div>
        </div>
        <div className="-mx-2 -mb-2 mt-1 flex justify-start">
          <CompareToggle slug={p.slug} />
        </div>
      </div>
    </Link>
  );
}
