import type { Metadata } from "next";
import { VerifyLink } from "@/components/account/VerifyLink";

// The emailed sign-in link (and the Google or Discord round trip) lands here; the code is in the fragment, read in the browser.
export const metadata: Metadata = { title: "Signing you in", robots: { index: false, follow: false } };

export default function Verify() {
  return (
    <div className="container-x max-w-xl py-16">
      <VerifyLink />
    </div>
  );
}
