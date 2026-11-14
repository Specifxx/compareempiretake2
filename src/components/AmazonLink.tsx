import Link from "next/link";
import { AMAZON_DISCLOSURE, AMAZON_REL, amazonAuLink } from "@/lib/amazon";
import { ExternalIcon } from "./icons";
import { AmazonLivePrice } from "./AmazonLivePrice";
import { CheckIcon } from "./icons";
import { StoreVote } from "./StoreVote";
import { CartAddButton } from "./cart/CartAddButton";
import { PIN_OUTLINE } from "./EbayListingRow";

/**
 * Amazon AU links. No Amazon price, rating or stock is shown (we have no API access), only
 * "Check price on Amazon". `data-amazon` feeds the click tracking in SiteAnalytics.
 */
type Props = { query: string; product?: string; placement: string };

const track = (p: Props) => ({ "data-buy": "amazon", "data-buy-kind": `amazon-${p.placement}`, "data-buy-product": p.product, "data-amazon": p.placement });

/**
 * A row shaped like the store rows on a product page, pinned above them. Never in Amazon's own colours
 * (2026-11-02: the Associates Operating Agreement forbids styling that could pass for Amazon's site). `href`/`name` override the AU link for the US and UK, which have no tag yet.
 */
export function AmazonRow({ href, name = "Amazon AU", live, cart, ...p }: Props & { href?: string; name?: string; live?: { text: string; at: string; zone?: { locale: string; timeZone: string; label: string } }; /** With a live price, the cart list's line (owner, 2026-11-06: like a store row; lib/cart-list.ts keeps it 24 hours). */ cart?: { title: string; priceCents: number; currency: string; image?: string | null } }) {
  const url = href ?? amazonAuLink(p.query);
  const add = live && cart ? { href: url, productUrl: url, storeName: name, title: cart.title, priceCents: cart.priceCents, currency: cart.currency, image: cart.image ?? null } : null;
  return (
    <a href={url} target="_blank" rel={AMAZON_REL} {...track(p)} className={`card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4 ${PIN_OUTLINE.amazon}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {name}
          <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Ad · Paid link</span>
          {/* The thumbs stop the row's link (StoreVote calls preventDefault). */}
          <StoreVote url={url} name={name} className="font-normal text-ink-mute" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {live && <span className="inline-flex items-center gap-1 text-save"><CheckIcon className="h-3.5 w-3.5" /> In stock</span>}
          <span>{live ? "New, Amazon's listing of this exact model." : "Also check the price on Amazon: new, sold by Amazon and marketplace sellers."}</span>
          {add && <CartAddButton inline {...add} className="text-xs sm:hidden" />}
        </div>
      </div>
      {live && <AmazonLivePrice text={live.text} at={live.at} zone={live.zone} />}
      {add && <CartAddButton {...add} className="hidden shrink-0 text-ink-mute sm:inline-flex" />}
      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-ink">
        {live ? "View on Amazon" : "Check Amazon"} <ExternalIcon className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

/** A compact button for cards and tables. */
export function AmazonButton({ className = "", ...p }: Props & { className?: string }) {
  return (
    <a href={amazonAuLink(p.query)} target="_blank" rel={AMAZON_REL} {...track(p)} className={`inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold transition hover:border-brand/40 hover:text-ink ${className}`}>
      Check price on Amazon <ExternalIcon className="h-3 w-3" />
    </a>
  );
}

/** The short disclosure shown near the first Amazon link on a page. */
export function AmazonNote({ className = "mt-1.5" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-ink-mute ${className}`}>
      {AMAZON_DISCLOSURE} <Link prefetch={false} href="/affiliate-disclosure" className="underline">Learn more</Link>
    </p>
  );
}
