import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoresView } from "@/views/StoresView";
import { regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "The US stores we compare",
  description: "Every US store Compare Empire checks each day, and how many listings each has.",
  alternates: { canonical: "/us/stores" },
};

export default function StoresPage() {
  if (!regionLive("us")) notFound();
  return <StoresView region="us" />;
}
