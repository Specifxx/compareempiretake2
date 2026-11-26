import Link from "next/link";
import type { Deal } from "@/lib/catalog";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { money, withRegion } from "@/lib/region";
import { sized } from "@/lib/image-size";
import { RetailerDot } from "./RetailerChip";

export const BOARD_ROWS = 5;

/** The stores' in-stock outright prices for the deal's variant, cheapest first, one per store, at most BOARD_ROWS. Pure. */
export function boardRows(d: Pick<Deal, "variant">): { retailer: Deal["offer"]["retailer"]; price: number }[] {
  const seen = new Set<string>();
  const rows: { retailer: Deal["offer"]["retailer"]; price: number }[] = [];
  for (const o of [...d.variant.offers].filter((o) => o.kind !== "plan" && o.inStock && o.price > 0).sort((a, b) => a.price - b.price)) {
    if (seen.has(o.retailer)) continue;
    seen.add(o.retailer);
    rows.push({ retailer: o.retailer, price: o.price });
    if (rows.length >= BOARD_ROWS) break;
  }
  return rows;
}

/**
 * The home hero's one picture (owner, 2026-11-27: "improve the graphics"): today's widest price gap as the site sees it, one
 * product's real store prices drawn as bars, cheapest first. Real data from the morning's import, never a mock-up; a deal with
 * fewer than three stores in stock draws nothing. Server HTML, no script, desktop only (the phone's hero stays the headline).
 */
/** The deal whose stores disagree most (as a share of the dearest price), among those with three or more in stock. Pure. */
export function widestGap(deals: Pick<Deal, "variant">[]): number {
  let best = -1;
  let gapOf = 0;
  deals.forEach((d, i) => {
    const r = boardRows(d);
    if (r.length < 3) return;
    const g = (r[r.length - 1].price - r[0].price) / r[r.length - 1].price;
    // Over 35% apart reads as a listing error, not a gap worth headlining.
    if (g > gapOf && g <= 0.35) [best, gapOf] = [i, g];
  });
  return best;
}

export function HeroBoard({ deals, updated }: { deals: Deal[]; updated: string }) {
  const deal = deals[widestGap(deals)];
  if (!deal) return null;
  const rows = boardRows(deal);
  const region = deal.phone.region ?? "au";
  const top = rows[rows.length - 1].price;
  const gap = top - rows[0].price;
  const href = `${withRegion(`/${deal.phone.category}/${deal.phone.slug}`, region)}?v=${deal.variant.id}`;
  const img = deal.offer.image ?? deal.phone.image;
  return (
    <Link href={href} prefetch={false} className="hero-board card group hidden w-full max-w-[420px] justify-self-end p-5 lg:block" aria-label={`${deal.phone.name}: compare ${rows.length} stores`}>
      <div className="flex items-center justify-between">
        <span className="eyebrow">Today&apos;s price gap</span>
        <span className="text-xs text-ink-mute">{updated}</span>
      </div>
      <div className="mt-3 flex items-center gap-3.5">
        <span className="img-tile relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px]">
          {img && <img src={sized(img, 220)} alt={deal.phone.name} loading="eager" className="product-img absolute inset-0 h-full w-full object-contain p-1.5" />}
        </span>
        <div className="min-w-0">
          <div className="line-clamp-2 text-[15px] font-semibold leading-snug group-hover:underline">
            {deal.phone.name} <span className="font-normal text-ink-mute">{storageLabel(deal.variant.storageGb)}</span>
          </div>
          <div className="mt-0.5 text-sm text-ink-mute">
            <span className="font-semibold text-save">{money(gap, region)}</span> between the cheapest and the dearest
          </div>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li key={r.retailer} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-ink-soft">
              <RetailerDot id={r.retailer} className="h-2 w-2" />
              <span className="truncate">{RETAILERS[r.retailer].name}</span>
            </span>
            <span className="board-track h-2 overflow-hidden rounded-[3px] bg-bg-sunk" aria-hidden>
              <span className={`board-bar block h-full rounded-[3px] ${i === 0 ? "bg-brand" : "bg-ink/25"}`} style={{ width: `${Math.max(8, Math.round((r.price / top) * 100))}%`, animationDelay: `${i * 70}ms` }} />
            </span>
            <span className={`price text-right ${i === 0 ? "text-ink" : "font-semibold text-ink-soft"}`}>{money(r.price, region)}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-ink-mute">Cheapest in stock first</span>
        <span className="font-semibold text-brand">Compare all stores →</span>
      </div>
    </Link>
  );
}
