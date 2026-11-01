import Link from "next/link";
import { AMAZON_DISCLOSURE, AMAZON_REL, amazonAuLink } from "@/lib/amazon";
import { ExternalIcon } from "./icons";

/**
 * Amazon AU links. No Amazon price, rating or stock is shown (we have no API access), only
 * "Check price on Amazon". `data-amazon` feeds the click tracking in SiteAnalytics.
 */
type Props = { query: string; product?: string; placement: string };

const track = (p: Props) => ({ "data-buy": "amazon", "data-buy-kind": `amazon-${p.placement}`, "data-buy-product": p.product, "data-amazon": p.placement });

/**
 * A row shaped like the store rows on a product page, pinned above them and tinted Amazon orange so it
 * is never lost. `href`/`name` override the AU link for the US and UK, which have no tag yet.
 */
export function AmazonRow({ href, name = "Amazon AU", ...p }: Props & { href?: string; name?: string }) {
  return (
    <a href={href ?? amazonAuLink(p.query)} target="_blank" rel={AMAZON_REL} {...track(p)} className="card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF9900] ring-1 ring-black/10" /> {name}
          <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Ad</span>
        </div>
        <div className="mt-1 text-xs text-ink-soft">New, sold by Amazon and marketplace sellers. We can&apos;t show Amazon&apos;s price here.</div>
      </div>
      <span className="hidden items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white sm:inline-flex">
        Check price on Amazon <ExternalIcon className="h-3.5 w-3.5" />
      </span>
      <ExternalIcon className="h-4 w-4 text-ink-mute sm:hidden" />
    </a>
  );
}

/** A compact button for cards and tables. */
export function AmazonButton({ className = "", ...p }: Props & { className?: string }) {
  return (
    <a href={amazonAuLink(p.query)} target="_blank" rel={AMAZON_REL} {...track(p)} className={`inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold transition hover:border-[#FF9900] hover:text-ink ${className}`}>
      Check price on Amazon <ExternalIcon className="h-3 w-3" />
    </a>
  );
}

/** The short disclosure shown near the first Amazon link on a page. */
export function AmazonNote({ className = "mt-1.5" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-ink-mute ${className}`}>
      {AMAZON_DISCLOSURE} <Link href="/affiliate-disclosure" className="underline">Learn more</Link>
    </p>
  );
}
