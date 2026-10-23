import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertStatus } from "@/components/AlertStatus";

export const metadata: Metadata = { title: "Price alerts", robots: { index: false } };

export default function AlertsPage() {
  return (
    <div className="container-x max-w-xl pt-16">
      <Suspense>
        <AlertStatus />
      </Suspense>
    </div>
  );
}
