import { SPONSORED_REL } from "@/lib/ebay";
import type { Phone } from "@/lib/types";
import { ExternalIcon } from "./icons";

/**
 * Today's cheapest matching new eBay listing for a product, from the eBay Browse API (checked daily
 * by scripts/ebay-prices.ts). Pinned above the store rows in eBay blue, labelled as an ad, never ranked among them.
 */
export function EbayListingRow({ listing, product, money, cheapest, locale, timeZone }: { listing: NonNullable<Phone["ebay"]>; product: string; money: (n: number) => string; cheapest?: number; locale: string; timeZone: string }) {
  const total = listing.price + (listing.shipping ?? 0);
  const below = cheapest !== undefined && total < cheapest;
  return (
    <a
      href={listing.url}
      target="_blank"
      rel={SPONSORED_REL}
      data-buy="ebay"
      data-buy-kind="ebay-listing"
      data-buy-product={product}
      data-buy-price={listing.price}
      className="card flex items-center gap-3 border-[#0064D2]/50 bg-[#E6F0FC] p-4 transition hover:border-[#0064D2] hover:shadow-lift dark:bg-[#0064D2]/20 sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#E53238] ring-1 ring-black/10" /> eBay
          <span className="rounded-full bg-[#0064D2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Ad · New · Shown first</span>
          {below && <span className="rounded-full bg-save/15 px-2 py-0.5 text-[10px] font-bold text-save">Below the stores</span>}
        </div>
        <div className="mt-1 truncate text-xs text-ink-soft" title={listing.title}>
          {listing.seller ? `${listing.seller}${listing.feedback ? ` · ${listing.feedback}% positive` : ""} · ` : ""}
          checked {new Date(listing.checkedAt).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone })}
        </div>
      </div>
      <div className="text-right">
        <div className="price text-xl sm:text-2xl">{money(listing.price)}</div>
        <div className="text-[11px] text-ink-mute">{listing.shipping === undefined ? "+ postage" : listing.shipping === 0 ? "Free postage" : `+ ${money(listing.shipping)} postage`}</div>
      </div>
      <span className="hidden items-center gap-1 rounded-xl bg-[#0064D2] px-3 py-2 text-sm font-bold text-white sm:inline-flex">
        View on eBay <ExternalIcon className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

/** When the daily job has no listing for a product: a pinned, labelled search of new eBay listings in the region. */
export function EbaySearchRow({ href, product, adjective }: { href: string; product: string; adjective: string }) {
  return (
    <a href={href} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind="ebay-pinned-search" data-buy-product={product} className="card flex items-center gap-3 border-[#0064D2]/50 bg-[#E6F0FC] p-4 transition hover:border-[#0064D2] hover:shadow-lift dark:bg-[#0064D2]/20 sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#E53238] ring-1 ring-black/10" /> eBay
          <span className="rounded-full bg-[#0064D2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Ad · Shown first</span>
        </div>
        <div className="mt-1 text-xs text-ink-soft">New, Buy It Now listings from {adjective} sellers, cheapest first</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0064D2] px-3 py-2 text-sm font-bold text-white">
        Search eBay <ExternalIcon className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}
