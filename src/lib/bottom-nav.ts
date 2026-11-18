// The phone bottom nav's switch and tabs (components/BottomNav.tsx, owner 2026-11-18; DECISIONS.md "Phone bottom nav").
// BOTTOM_NAV: "off" is the rollback (nothing renders, ?bn=1 included), "optin" shows it only to a visitor who opened a page with
// ?bn=1, "on" shows it to every phone visitor (?bn=0 still opts out). The tabs are worked out in the browser from the page.
import type { BottomNavMode, BottomNavTab } from "@/components/BottomNav";

export const BOTTOM_NAV: BottomNavMode = "on";

import { HOME_PATH, REGION_IDS, REGION_STORAGE_KEY, isNeutralPath, regionOf, withRegion, type RegionId } from "@/lib/region";

/** The header's search field (only used by a search tab that focuses it; this site's Search tab is its /search page). */
export const BOTTOM_NAV_SEARCH_INPUT = "header input[type='search'], header input[name='q']";

/** The page's region; on a page that belongs to none (guides, search…), the visitor's own (`ce-region`), else the US. */
function regionFor(pathname: string): RegionId {
  if (!isNeutralPath(pathname)) return regionOf(pathname);
  try {
    const kept = typeof localStorage === "undefined" ? null : localStorage.getItem(REGION_STORAGE_KEY);
    if (kept && (REGION_IDS as string[]).includes(kept)) return kept as RegionId;
  } catch {
    /* storage blocked */
  }
  return "us";
}

export function bottomNavTabs(pathname: string): BottomNavTab[] {
  const r = regionFor(pathname);
  return [
    { key: "home", label: "Home", href: HOME_PATH[r], exact: true, icon: "home" },
    { key: "search", label: "Search", href: "/search", icon: "search" },
    { key: "deals", label: "Deals", href: withRegion("/deals", r), icon: "deals" },
    { key: "cart", label: "Cart", action: "cart", icon: "cart" },
    { key: "menu", label: "Menu", action: "menu", icon: "menu" },
  ];
}
