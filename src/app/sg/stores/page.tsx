import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoresView } from "@/views/StoresView";
import { regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "The Singapore stores we compare",
  description: "Every Singapore store Compare Empire checks each day, and how many listings each has.",
  alternates: { canonical: "/sg/stores" },
};

export default function StoresPage() {
  if (!regionLive("sg")) notFound();
  return <StoresView region="sg" />;
}
