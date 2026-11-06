import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoresView } from "@/views/StoresView";
import { regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "The Canadian stores we compare",
  description: "Every Canadian store Compare Empire checks each day, and how many listings each has.",
  alternates: { canonical: "/ca/stores" },
};

export default function StoresPage() {
  if (!regionLive("ca")) notFound();
  return <StoresView region="ca" />;
}
