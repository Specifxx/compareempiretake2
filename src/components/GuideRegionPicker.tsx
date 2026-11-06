"use client";
import { useEffect, useState } from "react";
import { Flag } from "@/components/Flag";
import { REGIONS, type RegionId } from "@/lib/region";
import { rememberRegion } from "@/lib/use-region";

/**
 * "Prices for 🇺🇸 US · 🇬🇧 UK · 🇦🇺 Australia": switches which region's prices a guide shows (html[data-gr], read by the
 * .rg/.rgi rules in globals.css) and remembers the pick like the header's switcher. The server marks the US, the
 * default; the browser marks the reader's region once it has loaded.
 */
export function GuideRegionPicker({ regions }: { regions: RegionId[] }) {
  const [on, setOn] = useState<RegionId>("us");
  useEffect(() => {
    const gr = document.documentElement.dataset.gr as RegionId | undefined;
    if (gr && regions.includes(gr)) setOn(gr);
  }, [regions]);
  if (regions.length < 2) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Show prices for">
      <span className="text-ink-mute">Prices for</span>
      {regions.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={on === r}
          onClick={() => {
            document.documentElement.dataset.gr = r;
            rememberRegion(r);
            setOn(r);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition ${on === r ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-soft hover:border-ink-mute"}`}
        >
          <Flag code={r} /> {r === "us" || r === "uk" ? REGIONS[r].adjective : REGIONS[r].name}
        </button>
      ))}
    </div>
  );
}
