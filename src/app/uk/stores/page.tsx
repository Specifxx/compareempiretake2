import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoresView } from "@/views/StoresView";
import { regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "The UK stores we compare",
  description: "Every UK store Compare Empire checks each day, and how many listings each has.",
  alternates: { canonical: "/uk/stores" },
};

export default function StoresPage() {
  if (!regionLive("uk")) notFound();
  return <StoresView region="uk" />;
}
