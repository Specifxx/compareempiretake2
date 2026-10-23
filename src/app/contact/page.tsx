import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { OpenFeedbackButton } from "@/components/FeedbackWidget";

export const metadata: Metadata = {
  title: "Contact Compare Empire",
  description: "Email Compare Empire about a wrong price, a missing store, a partnership or your data.",
  alternates: { canonical: "/contact" },
};

const TOPICS: [string, string][] = [
  ["A price looks wrong", "Send the product link and what the store shows. We fix matching errors fast."],
  ["Add a store", "Tell us which Australian store you'd like us to check."],
  ["Retailers and partners", "Listing questions, corrections to your prices, or affiliate and partnership enquiries."],
  ["Your data", "Ask us to delete your alerts, feedback or reviews (see the privacy page)."],
  ["Press", "Price history data for stories about sales and fake discounts."],
];

export default function ContactPage() {
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">Contact</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Talk to us.</h1>
      <p className="mt-4 text-lg text-ink-soft">A real person reads every message, usually within two business days.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="btn-primary" href={`mailto:${CONTACT_EMAIL}?subject=Compare%20Empire`}>Email {CONTACT_EMAIL}</a>
        <OpenFeedbackButton className="btn-ghost">Send quick feedback</OpenFeedbackButton>
      </div>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {TOPICS.map(([t, d]) => (
          <li key={t} className="rounded-2xl border border-line bg-surface p-5">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-ink-soft">{d}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-ink-mute">
        Want to stop price-alert emails? Use the link at the bottom of any alert email, or see <Link className="underline" href="/alerts">price alerts</Link>.
      </p>
    </div>
  );
}
