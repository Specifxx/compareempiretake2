"use client";

import { useEffect, useState } from "react";
import { useRegion } from "@/lib/use-region";
import { SPONSORED_REL } from "@/lib/ebay";
import { AdDock, DockGate, DockTile, DOCK_LINK } from "./AdDock";
import type { RailTile, Rails } from "@/lib/side-rails";

// The two side rails (ported from DexCompare / MTG Compare / WargameCompare / RiftCompare; owner 2026-11-06: "the eBay ads … but
// instead of the TCGplayer ad, the Amazon ad banner that's scrollable"): eBay down the far left of a wide screen, Amazon down the
// far right, OUTSIDE the page's column, each up to ten products that scroll inside the rail.
//
//   • From MIN_WIDTH (1280px: every regular 16:9 and 16:10 screen, the sisters' rule). Below 1600px the page's column gives up
//     160px a side for them (globals.css: .container-x in <main> and the footer); from 1600px it is its full 80rem and the rails
//     sit just outside it. Pure CSS, the same on the server: nothing moves when the rails mount (CLS 0).
//   • Browser only: the tiles come from the static /rails/<region> after hydration, never in the server HTML (no SEO change).
//   • Fixed under the sticky header, clear of the feedback button. Labelled "Ad"; links rel sponsored, tagged side-ebay /
//     side-amazon. Amazon tiles carry no price (lib/side-rails.ts says why). Not a pop-up: nothing moves or covers content.
//   • Below MIN_WIDTH the eBay tiles go to the phone dock (AdDock.tsx); Amazon never does (an overlay).

export const MIN_WIDTH = 1280;
export const RAIL_W = 136;
/** Room at the right rail's foot for the feedback button (bottom-right, FeedbackWidget.tsx), inside the rail. */
const FOOT = 64;
/** One whole tile must fit between the header and the foot, or no rail. */
export const MIN_HEIGHT = 560;

const loaded = new Map<string, Promise<Rails | null>>();
function load(region: string): Promise<Rails | null> {
  let p = loaded.get(region);
  if (!p) {
    p = fetch(`/rails/${region}`)
      .then((r) => (r.ok ? (r.json() as Promise<Rails>) : null))
      .catch(() => null);
    loaded.set(region, p);
  }
  return p;
}

function useRails(enabled: boolean): Rails | null {
  const region = useRegion();
  const [rails, setRails] = useState<Rails | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    load(region).then((r) => live && setRails(r));
    return () => {
      live = false;
    };
  }, [region, enabled]);
  return enabled && rails?.region === region ? rails : null;
}

/** The rails, mounted once in the root layout. */
/** The side rails are OFF (owner, 2026-11-13: "banner ads on the side … doesn't look as good … fill in that space on the side again"): the ads are the strips inside the page and the phone dock. The rail code stays; nothing renders or fetches it while this is false. */
export const SIDE_RAILS = false;

export function SideRails() {
  const [fit, setFit] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [top, setTop] = useState(120);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const update = () => {
      setFit(SIDE_RAILS && mq.matches && window.innerHeight >= MIN_HEIGHT);
      setNarrow(!mq.matches);
      const h = document.querySelector("header");
      if (h) setTop(Math.round(h.getBoundingClientRect().height));
    };
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const rails = useRails(fit);
  if (narrow) return <RailDock />;
  if (!fit || !rails) return null;
  return (
    <>
      {rails.ebay.tiles.length >= 2 && (
        <Rail side="left" top={top} heading="On eBay" label={rails.ebay.label} tiles={rails.ebay.tiles} placement="side-ebay" more={rails.ebay.more} note="Affiliate · delivered" />
      )}
      {rails.amazon && rails.amazon.tiles.length >= 2 && (
        <Rail side="right" top={top} heading="On Amazon" label={rails.amazon.label} tiles={rails.amazon.tiles} placement="side-amazon" more={null} note="Paid links" />
      )}
    </>
  );
}

const TILE = "group flex flex-col border-b border-line bg-bg-card p-2 transition-colors hover:bg-bg-sunk";

function Rail({ side, top, heading, label, tiles, placement, more, note }: { side: "left" | "right"; top: number; heading: string; label: string; tiles: RailTile[]; placement: string; more: string | null; note: string }) {
  return (
    <div
      role="group"
      data-ad={placement}
      aria-label={`Sponsored: ${label}`}
      className="fixed z-30 flex flex-col border-line bg-bg-card"
      // Flush (owner, 2026-11-07: "I don't like how it's floating … no gap"): from the header to the window's foot, against the
      // window's edge, square, one hairline facing the page; tiles edge to edge. The feedback button sits in the right rail's foot.
      style={{ top, bottom: 0, width: RAIL_W, ...(side === "left" ? { left: 0, borderRightWidth: 1 } : { right: 0, borderLeftWidth: 1, paddingBottom: FOOT }) }}
    >
      <div className="flex h-[30px] shrink-0 items-center justify-between px-2">
        <span className="truncate text-[13px] font-bold tracking-tight">{heading}</span>
        <span className="rounded bg-bg-sunk px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Ad</span>
      </div>
      <ul role="list" className="rail-scroll grid min-h-0 flex-1 content-start overflow-y-auto overscroll-contain border-t border-line">
        {tiles.map((t) => (
          <li key={t.id}>
            <a href={t.href} target="_blank" rel={SPONSORED_REL} className={TILE}>
              <span className="img-tile relative block aspect-square w-full overflow-hidden rounded-lg">
                <img src={t.img} alt={`${t.name} on ${label}`} width={120} height={120} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="product-img absolute inset-0 h-full w-full object-contain p-1" />
              </span>
              <span className="mt-1.5 line-clamp-2 h-9 text-xs font-semibold leading-[18px] group-hover:text-brand">{t.name}</span>
              {t.price ? (
                <span className="block h-5 truncate text-[15px] font-bold tabular-nums leading-5">{t.price}</span>
              ) : (
                <span className="block h-5 truncate text-xs font-semibold leading-5 text-brand">See price ↗</span>
              )}
              <span className="sr-only">, on {label}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="flex shrink-0 flex-col px-2 py-2 text-[10px] leading-[13px] text-ink-mute">
        {more && (
          <a href={more} target="_blank" rel={SPONSORED_REL} className="truncate font-bold text-brand">
            More on {label} →
          </a>
        )}
        <span className="truncate">{note}</span>
      </p>
    </div>
  );
}

/** The eBay tag with the dock's placement in it (side-ebay → dock-ebay), so EPN's customid report tells the two apart. Pure. */
export function dockHref(href: string): string {
  return href.replace(/(customid=ce-[a-z]+-)side-ebay/, "$1dock-ebay");
}

function RailDock() {
  return (
    <DockGate minWidth={MIN_WIDTH}>
      <DockItems />
    </DockGate>
  );
}

function DockItems() {
  const rails = useRails(true);
  if (!rails) return null;
  const items = rails.ebay.tiles
    .filter((t) => t.price)
    .map((t) => (
      <a key={t.id} href={dockHref(t.href)} target="_blank" rel={SPONSORED_REL} className={DOCK_LINK}>
        <DockTile img={t.img} alt={`${t.name} on eBay`} brand={<span className="font-bold text-ink">eBay</span>} title={t.name} price={t.price!} cta="View" />
        <span className="sr-only">, on {rails.ebay.label}</span>
      </a>
    ));
  if (items.length === 0) return null;
  return <AdDock label={`Sponsored: on ${rails.ebay.label}`} items={items} placement="dock-ebay" minWidth={MIN_WIDTH} yieldTo="[data-ad], [data-dock-yield]" />;
}
