import type { Metadata } from "next";
import { StoresView } from "@/views/StoresView";

export const metadata: Metadata = {
  title: "The Australian stores we compare",
  description: "Every Australian store Compare Empire checks each day, how many listings each has, when we last checked it, and the big stores we don't cover yet.",
  alternates: { canonical: "/stores" },
};

export default function StoresPage() {
  return <StoresView region="au" />;
}
