"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { emailSignInLink, trackPremium } from "@/lib/premium-member";
import { OAuthButtons } from "./OAuthButtons";

const ERRORS: Record<string, string> = {
  provider_unavailable: "That sign-in isn't available right now. Use the email link instead.",
  no_email: "That account didn't share a verified email address. Try another way.",
  unverified: "That account's email isn't verified yet. Try another way.",
};

const PERKS: { t: string; d: string }[] = [
  { t: "Price alerts that are on at once", d: "Signed in, an alert is live the moment you set it: no confirmation email." },
  { t: "Every alert in one place", d: "See what you're watching and stop any of them with one tap, on any device you sign in on." },
  { t: "Premium when you want it", d: "No banner ads, 14 days free. Comparing prices stays free for everyone." },
];

/** Signed out on /account: why it's worth it on the left, the three ways in on the right. Google, Discord or an emailed link; no password. */
export function SignIn() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    trackPremium("signin_view", {});
    const e = new URLSearchParams(location.search).get("error");
    if (e) setMsg({ ok: false, text: ERRORS[e] ?? "That sign-in didn't finish. Try again, or use the email link." });
  }, []);

  async function send(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await emailSignInLink(email.trim());
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) trackPremium("signin_link_sent", {});
  }

  return (
    <div className="card overflow-hidden shadow-card md:grid md:grid-cols-[1.05fr_1fr]">
      <div className="relative overflow-hidden bg-brand p-6 text-brand-ink sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink/80">Free account</p>
        <h1 className="relative mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Never miss a price drop</h1>
        <ul className="relative mt-5 grid gap-4">
          {PERKS.map((p, i) => (
            <li key={p.t} className="flex gap-3">
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">{i + 1}</span>
              <span>
                <span className="block font-semibold">{p.t}</span>
                <span className="block text-sm text-brand-ink/85">{p.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-bold">Sign in or create your account</h2>
        <p className="mt-1 text-sm text-ink-mute">One tap, no password. New here? This makes your free account.</p>
        <OAuthButtons className="mt-5" />
        <div className="my-5 flex items-center gap-3 text-xs text-ink-mute">
          <span className="h-px flex-1 bg-line" /> or get a link by email <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={send} className="grid gap-2">
          <label htmlFor="signin-email" className="sr-only">Email</label>
          <input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          <button type="submit" disabled={busy} className="btn-primary h-11">{busy ? "Sending…" : "Email me a sign-in link"}</button>
        </form>
        <p role="status" aria-live="polite" className={`mt-3 min-h-[1.25rem] text-sm ${msg?.ok ? "text-save" : "text-hot"}`}>{msg?.text ?? ""}</p>
        <p className="mt-2 text-xs text-ink-mute">
          We use your address for your account and the alerts you ask for, nothing else. <Link prefetch={false} href="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
