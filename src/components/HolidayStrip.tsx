"use client";
// One line under the header on every page from 1 November to the day after Cyber Monday, linking the visitor's region's
// Black Friday page, then its Cyber Monday page (lib/black-friday.ts saleStrip, decided by the layout; DECISIONS.md,
// "Black Friday strip and Cyber Monday page", 2026-11-07). Client only to follow the region, as the header does; it is in
// each page's HTML. A link, never a pop-up, a countdown or "ends soon".
import Link from "next/link";
import { withRegion } from "@/lib/region";
import { useRegion } from "@/lib/use-region";
import { BfModeBar } from "@/components/BfModeBar";
import { bfModeOn } from "@/lib/bf-mode";

export function HolidayStrip({ sale }: { sale: { path: string; name: string } | null }) {
  const region = useRegion();
  const strip = sale ? (
    <div className="border-b border-line bg-bg-card" data-holiday-strip={sale.path.slice(1)}>
      <p className="container-x truncate py-1.5 text-center text-xs sm:text-sm">
        <Link prefetch={false} href={withRegion(sale.path, region)} className="hover:underline">
          <b>{sale.name} tech deals</b><span className="hidden sm:inline"> · real price drops we checked ourselves, no fake &ldquo;was&rdquo; prices</span> · <span className="font-semibold text-brand">see the deals →</span>
        </Link>
      </p>
    </div>
  ) : null;
  // For Black Friday itself (lib/bf-mode.ts, owner 2026-11-27) the line becomes the bold Black Friday bar, which falls back to it.
  const on = bfModeOn(Date.now());
  if (!on) return strip;
  return (
    <BfModeBar on={on} href={withRegion("/black-friday", region)} title="Tech deals" line="real price drops we checked ourselves, no fake “was” prices">
      {strip}
    </BfModeBar>
  );
}
