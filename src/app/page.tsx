import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata } from "@/views/region-meta";

// The site root is the US home (owner, 2026-11-01): Googlebot crawls from the US and most searchers are American.
// Australia's home is /au and the UK's /uk; a visitor from either is moved there in the browser (REGION_BOOT_SCRIPT),
// crawlers never are. /us redirects here (next.config.mjs).
export const generateMetadata = (): Metadata => regionHomeMetadata("us");

export default function Home() {
  return <HomeView region="us" />;
}
