import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata, regionLive } from "@/views/region-meta";

export const generateMetadata = (): Metadata => regionHomeMetadata("ca");

export default function Home() {
  if (!regionLive("ca")) notFound();
  return <HomeView region="ca" />;
}
