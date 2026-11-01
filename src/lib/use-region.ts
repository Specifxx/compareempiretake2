"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isNeutralPath, money, REGION_STORAGE_KEY, regionFromTimeZone, regionOf, REGIONS, withRegion, type RegionId } from "./region";

let soft: RegionId | undefined;

/** The visitor's own region: the one they picked in the header, else their time zone's, else the US. Browser only. */
export function visitorRegion(): RegionId {
  if (soft) return soft;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(REGION_STORAGE_KEY);
  } catch {}
  if (saved === "au" || saved === "us" || saved === "uk") return (soft = saved);
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {}
  return (soft = regionFromTimeZone(tz));
}

/** Remember a region the visitor chose (the header's switcher, RegionNotice's buttons). */
export function rememberRegion(r: RegionId) {
  soft = r;
  try {
    localStorage.setItem(REGION_STORAGE_KEY, r);
  } catch {}
}

/**
 * The region of the page being viewed, from its path ("/us/..." → us). A page of no region (about, legal, forum) is
 * rendered for the US on the server and moves to the visitor's own region after hydration.
 */
export function useRegion(): RegionId {
  const path = usePathname() ?? "/";
  const neutral = isNeutralPath(path);
  const [r, setR] = useState<RegionId>("us");
  useEffect(() => {
    if (neutral) setR(visitorRegion());
  }, [neutral]);
  return neutral ? r : regionOf(path);
}

/** Currency formatter and link helper for the current region. */
export function useRegionKit() {
  const region = useRegion();
  return { region, R: REGIONS[region], $: (n: number) => money(n, region), href: (h: string) => withRegion(h, region) };
}
