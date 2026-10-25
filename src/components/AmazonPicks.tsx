import Link from "next/link";
import { getSummaries, type PhoneSummary } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { AmazonButton, AmazonNote } from "./AmazonLink";

/**
 * "Top picks on Amazon AU": the most-compared products (most stores, newest first), each with a
 * "Check price on Amazon" link. Australia only. No Amazon price is shown: the price on the card is
 * ours, labelled as the best price at the other Australian stores.
 */
export function AmazonPicks({ category, limit = 8, title }: { category?: CategoryId; limit?: number; title?: string }) {
  // The home page takes the most-compared product from each of the top categories, so it isn't all phones.
  const picks = category ? pick(getSummaries(category), limit) : HOME_CATEGORIES.flatMap((c) => pick(getSummaries(c), 1)).slice(0, limit);
  if (picks.length < 4) return null;
  return (
    <section className="mt-12" aria-label="Top picks on Amazon AU">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{title ?? "Top picks on Amazon AU"}</h2>
          <p className="mt-1 text-sm text-ink-mute">The products Australians compare most. Check Amazon&apos;s price against the best price we found elsewhere.</p>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {picks.map((p) => (
          <div key={p.href} className="card flex flex-col p-3">
            <Link href={p.href} className="img-tile grid aspect-square place-items-center overflow-hidden rounded-xl">
              {p.image && <img src={p.image} alt="" loading="lazy" className="product-img h-full w-full object-contain p-3" />}
            </Link>
            <Link href={p.href} className="mt-2 line-clamp-2 text-sm font-semibold leading-snug hover:text-brand">{p.name}</Link>
            <div className="mt-1 text-xs text-ink-mute">
              Best elsewhere: <b className="text-ink">${Math.round(p.bestPrice).toLocaleString("en-AU")}</b> at {p.retailerCount} stores
            </div>
            <AmazonButton query={p.name} product={p.href} placement={category ? `picks-${category}` : "picks-home"} className="mt-3 w-full" />
          </div>
        ))}
      </div>
      <AmazonNote className="mt-3" />
    </section>
  );
}

const HOME_CATEGORIES: CategoryId[] = ["phones", "tvs", "laptops", "headphones", "tablets", "smartwatches", "consoles", "robot-vacuums", "speakers", "monitors"];

function pick(items: PhoneSummary[], n: number) {
  return items
    .filter((p) => p.image && p.inStock && p.retailerCount >= 3)
    .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
    .slice(0, n);
}
