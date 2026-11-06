import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata, regionLive } from "@/views/region-meta";

export const generateMetadata = (): Metadata => regionHomeMetadata("sg");

export default function Home() {
  if (!regionLive("sg")) notFound();
  return <HomeView region="sg" />;
}
