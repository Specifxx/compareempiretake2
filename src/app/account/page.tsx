import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

// Accounts (owner, 2026-11-28): sign in, your price alerts, your saved list and Premium. Static shell; the browser does the rest.
export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false }, alternates: { canonical: "/account" } };

export default function Account() {
  return (
    <div className="container-x max-w-4xl pb-16 pt-8 sm:pt-12">
      <AccountPage />
    </div>
  );
}
