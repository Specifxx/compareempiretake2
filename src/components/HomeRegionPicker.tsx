"use client";

import Link from "next/link";
import { HOME_PATH, REGIONS, type RegionId } from "@/lib/region";
import { rememberRegion } from "@/lib/use-region";
import { Flag } from "./Flag";

// The home hero's country row (owner, 2026-11-02: "the region switcher must be more prevalent … on the main home page hero
// … and have the flags as well"): each live country's home as a flag chip, the current one marked. Plain links to each
// country's home, remembered on click (rememberRegion) so the region script doesn't move the visitor back to their time
// zone's home.
export function HomeRegionPicker({ region, regions }: { region: RegionId; regions: RegionId[] }) {
  if (regions.length < 2) return null;
  return (
    <nav aria-label="Choose your country" className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm font-medium text-ink-mute">Prices for</span>
      {regions.map((r) => {
        const on = r === region;
        return (
          <Link
            key={r}
            href={HOME_PATH[r]}
            prefetch={false}
            onClick={() => rememberRegion(r)}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
              on ? "border-brand bg-brand/10 text-brand" : "border-line bg-bg-card text-ink-soft hover:border-brand/50 hover:text-ink"
            }`}
          >
            <Flag code={r} />
            {REGIONS[r].name}
            {on && <span className="text-xs font-medium text-ink-mute">{REGIONS[r].currency}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
