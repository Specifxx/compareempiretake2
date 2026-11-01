"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOT_UA, HOME_PATH, isNeutralPath, REGIONS, regionOf, type RegionId } from "@/lib/region";
import { rememberRegion, visitorRegion } from "@/lib/use-region";

/**
 * A visitor on a page of another region that has no copy in theirs (an Australian guide, brand or comparison page)
 * stays on it (REGION_BOOT_SCRIPT moves them only when the page lists their region as an hreflang alternate) and gets
 * one line saying whose prices these are, with their own region's home a tap away. Never a pop-up; never for crawlers.
 */
export function RegionNotice() {
  const path = usePathname() ?? "/";
  const [want, setWant] = useState<RegionId | null>(null);
  const page = regionOf(path);
  useEffect(() => {
    if (isNeutralPath(path) || BOT_UA.test(navigator.userAgent)) return setWant(null);
    const v = visitorRegion();
    const alt = document.querySelector(`link[rel="alternate"][hreflang="${REGIONS[v].hreflang}"]`);
    setWant(v !== page && !alt ? v : null);
  }, [path, page]);
  if (!want) return null;
  const W = REGIONS[want];
  const P = REGIONS[page];
  return (
    <div className="border-b border-line bg-bg-sunk">
      <div className="container-x flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
        <span>
          {W.flag} In {want === "au" ? "Australia" : `the ${want.toUpperCase()}`}? This page compares {P.adjective} prices ({P.currency}).
        </span>
        <Link href={HOME_PATH[want]} onClick={() => rememberRegion(want)} className="font-semibold text-brand hover:underline">
          See {W.adjective} prices
        </Link>
        <button
          type="button"
          className="text-ink-mute hover:text-ink"
          onClick={() => {
            rememberRegion(page);
            setWant(null);
          }}
        >
          Stay on {page === "au" ? "Australia" : P.adjective}
        </button>
      </div>
    </div>
  );
}
