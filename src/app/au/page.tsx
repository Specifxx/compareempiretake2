import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata } from "@/views/region-meta";

// Australia's home (it was the site root until 2026-11-01, when the root became the US home). Every other Australian
// page keeps its prefix-less URL.
export const generateMetadata = (): Metadata => regionHomeMetadata("au");

export default function Home() {
  return <HomeView region="au" />;
}
