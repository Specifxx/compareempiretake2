import type { Metadata } from "next";
import { PremiumPanel } from "@/components/account/PremiumPanel";
import { PREMIUM_PRICE_LINE } from "@/lib/premium-member";
import { CONTACT_EMAIL } from "@/lib/site";

// Compare Empire Premium (owner, 2026-11-28: accounts and "all the features that users have"). Static; the browser asks the shared
// account service. Comparing prices, the cheapest price, deals and price alerts stay free for everyone.
export const metadata: Metadata = {
  title: "Premium: no banner ads",
  description: `Compare Empire Premium: no banner ads on any page, and the same account on our other price comparison sites. ${PREMIUM_PRICE_LINE}. Comparing prices stays free.`,
  alternates: { canonical: "/premium" },
  robots: { index: false, follow: true },
};

export default function PremiumPage() {
  return (
    <div className="container-x max-w-3xl pb-16 pt-8 sm:pt-12">
      <p className="eyebrow">New · 14 days free</p>
      <h1 className="page-title mt-1">Compare Empire Premium</h1>
      <p className="page-lede">Comparing prices stays free, and so do price alerts and today&apos;s deals. Premium is for people who use the site a lot and want it calmer.</p>
      <div className="mt-6">
        <PremiumPanel />
      </div>
      <div className="prose-ce mt-10">
        <h2>What you get</h2>
        <ul>
          <li><strong>No banner ads.</strong> The sponsored blocks, the phone ad dock and the deals card disappear while you are signed in. Price tables, the stores in them and their order do not change.</li>
          <li><strong>One account.</strong> The same sign-in, and the same Premium, on our other price comparison sites.</li>
        </ul>
        <h2>How it works</h2>
        <p>
          Sign in with Google, Discord or an emailed link (no password), pick monthly or yearly, and start the 14-day trial through Stripe&rsquo;s secure checkout.
          You are not charged until day 15, and you can cancel any time from <strong>Manage billing</strong> on this page. If it lapses, the ads come back; your alerts keep working.
        </p>
        <h2>What it does not do</h2>
        <p>It never changes which stores are shown, in what order, or hides a price. Every price is the store&rsquo;s own.</p>
        <p>Questions? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </div>
    </div>
  );
}
