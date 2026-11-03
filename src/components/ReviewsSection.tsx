"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadFeed, type SiteReviewsFeed } from "@/lib/site-reviews";

interface Review { id: number | string; name: string; rating: number; body: string; created_at: string }
interface Data { enabled: boolean; reviews: Review[]; count: number; average: number | null }

const openReview = () => window.dispatchEvent(new CustomEvent("ce:feedback", { detail: "review" }));

export function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`text-[#E7A600] ${className}`} aria-label={`${n} out of 5 stars`}>
      {"★★★★★".slice(0, Math.round(n))}
      <span className="text-line">{"★★★★★".slice(Math.round(n))}</span>
    </span>
  );
}

/** Reviews of Compare Empire itself, loaded live so new ones show without a rebuild. */
export function ReviewsSection({ limit = 6, full }: { limit?: number; full?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    // Since 2026-11-03 new ratings and reviews go to RiftCompare's shared review service (approved in its admin; stars count at
    // once). Reviews sent before then stay in this site's own table. Both are shown, newest first, and the score counts both.
    const own = fetch("/api/reviews")
      .then((r) => r.json() as Promise<Data>)
      .catch((): Data => ({ enabled: false, reviews: [], count: 0, average: null }));
    Promise.all([own, loadFeed()]).then(([o, f]) => setData(mergeReviews(o, f)));
  }, []);
  if (data && !data.enabled) return null;
  const reviews = data?.reviews.slice(0, full ? undefined : limit) ?? [];
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">What people say</div>
          {data?.count ? (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">{data.average?.toFixed(1)}</span>
              <Stars n={data.average ?? 0} className="text-xl" />
              <span className="text-sm text-ink-mute">from {data.count} {data.count === 1 ? "rating" : "ratings"}</span>
            </div>
          ) : (
            <div className="mt-1 font-display text-2xl font-extrabold">{data ? "Be the first to review Compare Empire" : "Loading reviews…"}</div>
          )}
          <p className="mt-1 text-sm text-ink-mute">Every genuine review is published, good or bad.</p>
        </div>
        <div className="flex gap-2">
          {!full && data?.count ? <Link prefetch={false} href="/reviews" className="btn-ghost">All reviews</Link> : null}
          <button onClick={openReview} className="btn-primary">★ Write a review</button>
        </div>
      </div>
      {reviews.length > 0 && (
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="bg-bg-card p-5">
              <Stars n={r.rating} />
              <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{r.body}</p>
              <div className="mt-3 text-xs text-ink-mute">
                {r.name} · {new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** This site's own (pre-2026-11-03) reviews and the shared service's, as one list and one score. Pure. */
export function mergeReviews(own: Data, shared: SiteReviewsFeed | null): Data {
  const sharedReviews: Review[] = (shared?.reviews ?? [])
    .filter((r) => r.rating != null)
    .map((r) => ({ id: `s-${r.id}`, name: r.name, rating: r.rating as number, body: r.message, created_at: r.date }));
  const ownCount = own.enabled ? own.count : 0;
  const sharedCount = shared?.rating?.count ?? 0;
  const count = ownCount + sharedCount;
  const sum = (own.enabled && own.average != null ? own.average * ownCount : 0) + (shared?.rating ? shared.rating.average * sharedCount : 0);
  const reviews = [...sharedReviews, ...(own.enabled ? own.reviews : [])].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return { enabled: own.enabled || !!shared, reviews, count, average: count ? Math.round((sum / count) * 10) / 10 : null };
}
