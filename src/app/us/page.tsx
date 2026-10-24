import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/views/HomeView";
import { regionHomeMetadata, regionLive } from "@/views/region-meta";

export const generateMetadata = (): Metadata => regionHomeMetadata("us");

export default function Home() {
  if (!regionLive("us")) notFound();
  return <HomeView region="us" />;
}
