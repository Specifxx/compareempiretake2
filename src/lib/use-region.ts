"use client";
import { usePathname } from "next/navigation";
import { money, regionOf, REGIONS, withRegion, type RegionId } from "./region";

/** The region of the page being viewed, from its path ("/us/..." → us). */
export function useRegion(): RegionId {
  return regionOf(usePathname() ?? "/");
}

/** Currency formatter and link helper for the current region. */
export function useRegionKit() {
  const region = useRegion();
  return { region, R: REGIONS[region], $: (n: number) => money(n, region), href: (h: string) => withRegion(h, region) };
}
