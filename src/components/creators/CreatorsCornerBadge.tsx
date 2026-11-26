import Link from "next/link";

// The creators hub, visible on the homepage before any scroll: RiftCompare's CreatorsCornerBadge (owner, 2026-11-03: "just a bubble
// and then a really nice formatted creators page"). In the hero's top-right corner from sm up; on a phone, where a corner badge would
// sit on the headline, a small centred pill above it instead. Server component, static: nothing to fetch, nothing to hydrate.
export function CreatorsCornerBadge() {
  // A quiet text link under the hero's search (2026-11-27, the shared design standard: no pill or pulsing dot above a headline).
  return (
    <Link href="/creators" prefetch={false} className="group inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
      <span className="font-semibold text-ink">Tech creators</span>
      <span className="font-semibold text-brand group-hover:underline">Buy them a coffee →</span>
    </Link>
  );
}
