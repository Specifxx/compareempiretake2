import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata, regionLive } from "@/views/region-meta";

export const generateMetadata = (): Metadata => regionHomeMetadata("uk");

export default function Home() {
  if (!regionLive("uk")) notFound();
  return <HomeView region="uk" />;
}
