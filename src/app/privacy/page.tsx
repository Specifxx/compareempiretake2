import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Compare Empire",
  description: "What Compare Empire collects (very little), why, and how to remove it.",
  alternates: { canonical: "/privacy" },
};

const CONTACT = "hello@compareempire.com";

export default function PrivacyPage() {
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">Privacy</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">We collect as little as we can.</h1>
      <div className="mt-8 space-y-6 text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <p>You can use every page of Compare Empire without an account and without giving us anything. This page covers the few things you can choose to send us.</p>
        <h2>Price-drop alerts</h2>
        <p>
          We store your email address, the product and your target price. We email you only after you confirm the alert, and only about the products you asked
          for. Every alert email has a one-click unsubscribe link for that alert or all of them, as required by the Spam Act 2003.
        </p>
        <h2>Feedback and reviews</h2>
        <p>
          We store what you write and, if you give it, your email so we can reply. Reviews show your chosen name and never your email. We read every review
          before it appears, and we publish negative reviews too, as long as they are genuine and not abusive.
        </p>
        <h2>What else we keep</h2>
        <p>
          To stop spam we keep a one-way hash of your IP address with each submission, not the address itself. Visitor numbers come from Vercel Web Analytics,
          which uses no cookies and doesn&apos;t identify you.
        </p>
        <h2>Who handles it</h2>
        <p>The site runs on Vercel; submissions are stored with Neon (Postgres); emails are sent through Resend. We never sell or share your details.</p>
        <h2>Remove your data</h2>
        <p>
          Email <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will delete everything linked to your address. Unsubscribing from an alert
          stops all emails about it straight away.
        </p>
      </div>
    </div>
  );
}
