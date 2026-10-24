import Link from "next/link";
import { ebayDeals, ebaySearch, SPONSORED_REL } from "@/lib/ebay";

/** A clearly labelled eBay box: new, used and refurbished searches plus eBay's tech deals. */
export function EbayStrip({ query, label, customid, phones }: { query: string; label: string; customid: string; phones?: boolean }) {
  const links: [string, string, string][] = [
    ["New on eBay", "Brand-new listings from Australian sellers", ebaySearch(query, { condition: "new", customid, phones })],
    ["Refurbished on eBay", "Seller and eBay-certified refurbished", ebaySearch(query, { condition: "refurbished", customid, phones })],
    ["Used on eBay", "Often the cheapest way in", ebaySearch(query, { condition: "used", customid, phones })],
    ["eBay tech deals", "eBay's own daily tech deals", ebayDeals(customid)],
  ];
  return (
    <section className="mt-10 rounded-2xl border border-line bg-bg-card p-5" aria-label="eBay">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Shop {label} on eBay</h2>
        <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(([t, d, href]) => (
          <a key={t} data-buy="ebay" data-buy-product={customid} data-buy-kind={`strip-${t.split(" ")[0].toLowerCase()}`} href={href} target="_blank" rel={SPONSORED_REL} className="rounded-xl bg-bg-sunk px-3 py-2.5 text-sm transition hover:bg-brand-soft">
            <span className="font-semibold">{t} ↗</span>
            <span className="block text-[11px] text-ink-mute">{d}</span>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-mute">
        We may earn a commission if you buy through these links. It never changes our price rankings. <Link href="/disclosure" className="underline">How we make money</Link>
      </p>
    </section>
  );
}
