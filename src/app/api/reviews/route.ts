import { legacyReviews } from "@/lib/legacy-reviews";
import { json } from "@/lib/server-utils";

// No database since 2026-11-19: the pre-2026-11-03 reviews are a committed file (lib/legacy-reviews.ts) and new reviews go
// to RiftCompare's shared review service. The CDN holds it a day. Kept so a page cached before the change still gets an answer.
export const dynamic = "force-dynamic";

export type { LegacyReview as PublicReview } from "@/lib/legacy-reviews";

export function GET() {
  return Response.json(legacyReviews(), { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
}

export function POST() {
  return json({ ok: false, error: "Reviews are written in the review tab of the feedback button now. Thank you!" }, 410);
}
