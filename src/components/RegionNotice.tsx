"use client";
import { Flag } from "@/components/Flag";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOT_UA, HOME_PATH, isNeutralPath, REGIONS, regionOf, type RegionId } from "@/lib/region";
import { rememberRegion, visitorRegion } from "@/lib/use-region";

/**
 * A visitor on another region's page gets one line saying whose prices these are, with their own region's copy of the
 * page (its hreflang alternate) or, when it has none, their region's home a tap away. Nobody is moved automatically
 * (2026-11-02): REGION_BOOT_SCRIPT moves only a visitor who picked a region, so a visitor who has picked one never sees
 * this on a page with a copy in theirs. Never a pop-up; never for crawlers.
 */
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };

export function RegionNotice() {
  const path = usePathname() ?? "/";
  const [want, setWant] = useState<RegionId | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const page = regionOf(path);
  useEffect(() => {
    if (isNeutralPath(path) || BOT_UA.test(navigator.userAgent)) return setWant(null);
    const v = visitorRegion();
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${REGIONS[v].hreflang}"]`);
    setTo(alt?.href ? new URL(alt.href, location.href).pathname : null);
    setWant(v !== page ? v : null);
  }, [path, page]);
  if (!want) return null;
  const W = REGIONS[want];
  const P = REGIONS[page];
  return (
    <div className="border-b border-line bg-bg-sunk">
      <div className="container-x flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
        <span>
          <Flag code={want} /> In {IN[want]}? This page compares {P.adjective} prices ({P.currency}).
        </span>
        <Link prefetch={false} href={to ?? HOME_PATH[want]} onClick={() => rememberRegion(want)} className="font-semibold text-brand hover:underline">
          {to ? `Switch to ${W.adjective} prices` : `See ${W.adjective} prices`}
        </Link>
        <button
          type="button"
          className="text-ink-mute hover:text-ink"
          onClick={() => {
            rememberRegion(page);
            setWant(null);
          }}
        >
          Stay on {page === "au" || page === "ca" || page === "sg" ? P.name : P.adjective}
        </button>
      </div>
    </div>
  );
}
