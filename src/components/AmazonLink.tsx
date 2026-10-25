import Link from "next/link";
import { AMAZON_DISCLOSURE, AMAZON_REL, amazonAuLink } from "@/lib/amazon";
import { ExternalIcon } from "./icons";

/**
 * Amazon AU links. No Amazon price, rating or stock is shown (we have no API access), only
 * "Check price on Amazon". `data-amazon` feeds the click tracking in SiteAnalytics.
 */
type Props = { query: string; product?: string; placement: string };

const track = (p: Props) => ({ "data-buy": "amazon", "data-buy-kind": `amazon-${p.placement}`, "data-buy-product": p.product, "data-amazon": p.placement });

/** A row styled like the store rows on a product page. */
export function AmazonRow(p: Props) {
  return (
    <div>
      <a href={amazonAuLink(p.query)} target="_blank" rel={AMAZON_REL} {...track(p)} className="card flex items-center gap-3 border-dashed p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF9900] ring-1 ring-black/10" /> Amazon AU
            <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Ad</span>
          </div>
          <div className="mt-1 text-xs text-ink-mute">Sold by Amazon and marketplace sellers. We can&apos;t show Amazon&apos;s price here.</div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-line bg-bg-card px-3 py-2 text-sm font-semibold">
          Check price on Amazon <ExternalIcon className="h-3.5 w-3.5" />
        </span>
      </a>
      <AmazonNote />
    </div>
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
