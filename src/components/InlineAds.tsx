"use client";

import Link from "next/link";
import { useRef } from "react";
import { SPONSORED_REL } from "@/lib/ebay";
import type { RailTile, Rails } from "@/lib/side-rails";
import { useAdFeed } from "./useAdFeed";

// The eBay and Amazon ad rows (owner, 2026-11-27: "I don't see these eBay ads anywhere … we need the Amazon banner ads … not at
// the very end of the page"; DECISIONS.md 2026-11-27). Each row is a full-width banner of up to ten tiles that scrolls sideways,
// in the site's own card with the partner's colour on a thin top edge and a small "Ad" label. Pages place them mid-page, where a
// visitor scrolling the products meets them, never at the very foot:
//
//   • the home page: the eBay row after today's price drops, the Amazon row after the launches;
//   • a product page: both rows straight under "Similar price range" (the prices, the chart and similar products come first);
//   • a category grid: the eBay row after the first eight cards, the Amazon row under the grid;
//   • deals and hub pages: both rows, after their list.
//
//   • Browser only: the tiles come from the static /rails/<region> file after hydration, never in the server HTML. The rows'
//     height is reserved in CSS before they arrive (CLS 0); with nothing to show a row folds away.
//   • Never beside a buy button, above the product's own price, in the quick view, in a pop-up or in the phone dock (Amazon).
//     data-ad makes the phone dock yield to it. Nothing here reacts to typing or moves on its own.
//   • Links rel sponsored, tagged inline-ebay / inline-amazon (lib/side-rails.ts). Amazon tiles carry NO price (its licence).
//     Never a store, a best price, a deal or an alert.

/** Tiles per row. */
export const ROW_TILES = 10;
/** The old single block's size, kept for blockTiles. */
export const BLOCK_TILES = 6;
/** The Amazon tiles' share of the six when the region has Amazon. */
export const BLOCK_AMAZON = 2;

export interface BlockTile extends RailTile {
  source: "ebay" | "amazon";
}

/** Six tiles, eBay's first, then Amazon's; the whole row is eBay where there is no Amazon. Pure. (The quick mixed set.) */
export function blockTiles(rails: Pick<Rails, "ebay" | "amazon">): BlockTile[] {
  const amazon = (rails.amazon?.tiles ?? []).slice(0, BLOCK_AMAZON);
  const ebay = rails.ebay.tiles.slice(0, BLOCK_TILES - amazon.length);
  return [...ebay.map((t) => ({ ...t, source: "ebay" as const })), ...amazon.map((t) => ({ ...t, source: "amazon" as const }))];
}

/** One partner's row: its own tiles only, at most ROW_TILES, and only when there are two or more. Pure. */
export function rowTiles(rails: Pick<Rails, "ebay" | "amazon">, source: "ebay" | "amazon"): BlockTile[] {
  const list = source === "ebay" ? rails.ebay.tiles : rails.amazon?.tiles ?? [];
  const out = list.slice(0, ROW_TILES).map((t) => ({ ...t, source }));
  return out.length >= 2 ? out : [];
}

type Only = "ebay" | "amazon";

// One row, header to note: the card's padding, the header line, a tile (photo, two-line name, price line) and the note.
const ROW_H = "min-h-[388px] sm:min-h-[356px]";
const BOTH_H = "min-h-[716px] sm:min-h-[668px]";

/**
 * The ad rows. `only` draws one partner's row; without it both rows sit in one block, eBay first.
 * `pos` names where the page placed it, sent with every click (data-buy-kind inline-<pos>).
 */
export function InlineAds({ only, pos = "page", className = "mt-10" }: { only?: Only; pos?: string; className?: string }) {
  const rails = useAdFeed(true);
  if (rails === null) return null;
  const sources: Only[] = only ? [only] : ["ebay", "amazon"];
  const rows = rails ? sources.map((s) => ({ s, tiles: rowTiles(rails, s) })).filter((r) => r.tiles.length) : [];
  if (rails && !rows.length) return null;
  const tall = !rails ? sources.length > 1 && !only : rows.length > 1;
  return (
    // The reserved height before the tiles arrive: one row, or two.
    <section data-ad={rails ? `inline-${pos}` : undefined} aria-label="Sponsored" aria-hidden={rails ? undefined : true} className={`${className} ${tall ? BOTH_H : ROW_H}`}>
      {rails && (
        <div className="ad-rows card overflow-hidden">
          {rows.map(({ s, tiles }, i) => (
            <AdRow key={s} source={s} tiles={tiles} rails={rails} pos={pos} first={i === 0} />
          ))}
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-mute sm:px-5">
            Paid links: we may earn a commission if you buy through them. They never change our rankings or our best price.{" "}
            <Link prefetch={false} href="/disclosure" className="underline">
              How we make money
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}

const PARTNER = {
  ebay: { name: "eBay", title: "Today on eBay", sub: "Live listings for the products people compare most", edge: "ad-edge-ebay" },
  amazon: { name: "Amazon", title: "Shop these on Amazon", sub: "Tap a product to see Amazon's price", edge: "ad-edge-amazon" },
} as const;

const TILE = "ad-tile group flex h-full flex-col rounded-[10px] border border-line bg-bg p-2.5 transition-colors hover:border-ink/40";

function AdRow({ source, tiles, rails, pos, first }: { source: Only; tiles: BlockTile[]; rails: Rails; pos: string; first: boolean }) {
  const list = useRef<HTMLUListElement>(null);
  const p = PARTNER[source];
  const label = source === "ebay" ? rails.ebay.label : rails.amazon?.label ?? "Amazon";
  const scroll = (dir: 1 | -1) => list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className={`${p.edge} ${first ? "" : "border-t border-line"} px-4 pb-4 pt-3.5 sm:px-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            {p.title}
            <span className="rounded-[6px] border border-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Ad</span>
          </h2>
          <p className="truncate text-xs text-ink-mute">{p.sub} · {label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {source === "ebay" && (
            <a href={rails.ebay.more} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind={`inline-${pos}-more`} className="hidden text-sm font-semibold text-ink-soft hover:text-ink hover:underline sm:inline">
              More on eBay ↗
            </a>
          )}
          <button type="button" aria-label={`Scroll ${p.name} back`} onClick={() => scroll(-1)} className="ad-arrow hidden md:grid">‹</button>
          <button type="button" aria-label={`Scroll ${p.name} on`} onClick={() => scroll(1)} className="ad-arrow hidden md:grid">›</button>
        </div>
      </div>
      <ul ref={list} role="list" className="ad-scroll -mx-4 mt-3 flex snap-x scroll-px-4 sm:scroll-px-5 gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-5 sm:px-5">
        {tiles.map((t) => (
          <li key={`${source}-${t.id}`} className="w-[150px] shrink-0 snap-start sm:w-[168px]">
            <a href={t.href} target="_blank" rel={SPONSORED_REL} data-buy={source} data-buy-product={t.id} data-buy-kind={`inline-${pos}`} className={TILE}>
              <span className="img-tile relative block h-32 w-full overflow-hidden rounded-[7px]">
                <img src={t.img} alt={`${t.name} on ${label}`} width={128} height={128} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="product-img absolute inset-0 h-full w-full object-contain p-2" />
              </span>
              <span className="mt-2 line-clamp-2 h-10 text-[13px] font-semibold leading-5 group-hover:underline">{t.name}</span>
              <span className="mt-1.5 flex h-6 items-center justify-between gap-2">
                {t.price ? <span className="truncate text-[15px] font-bold tabular-nums">{t.price}</span> : <span className="truncate text-xs font-semibold text-ink-soft">See price ↗</span>}
                <span className={`ad-mark-${source} shrink-0 rounded-[5px] px-1.5 py-px text-[10px] font-bold`}>{p.name}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
