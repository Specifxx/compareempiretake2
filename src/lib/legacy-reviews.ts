// Compare Empire's own reviews from before 2026-11-03 (new ones go to RiftCompare's shared review service, lib/site-reviews.ts).
// They used to be read from the Neon `reviews` table on every /reviews visit; since 2026-11-19 they are a committed file,
// written once by scripts/export-legacy-reviews.ts (export-legacy-reviews.yml), so showing reviews never wakes the database.
import legacy from "../../data/reviews/legacy.json";

export interface LegacyReview { id: number; name: string; rating: number; body: string; created_at: string }
export interface LegacyReviews { enabled: boolean; reviews: LegacyReview[]; count: number; average: number | null }

export function legacyReviews(): LegacyReviews {
  const f = legacy as { reviews: LegacyReview[]; count: number; average: number | null };
  return { enabled: true, reviews: f.reviews ?? [], count: f.count ?? 0, average: f.average ?? null };
}
