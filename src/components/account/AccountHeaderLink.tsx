"use client";

import Link from "next/link";
import { usePremium } from "./usePremium";

/** The header's account door: a person icon signed out, the member's initial signed in (gold ring for Premium). Never opens anything by itself. */
export function AccountHeaderLink() {
  const v = usePremium();
  const signedIn = v.status === "member" || v.status === "free";
  const initial = signedIn ? (v.info.who.trim()[0] || "•").toUpperCase() : "";
  return (
    <Link
      prefetch={false}
      href="/account"
      aria-label={signedIn ? "Your account" : "Sign in"}
      title={signedIn ? "Your account" : "Sign in: alerts that follow you"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-bg-sunk hover:text-ink"
    >
      {signedIn ? (
        <span aria-hidden className={`grid h-7 w-7 place-items-center rounded-full bg-brand text-[13px] font-bold text-brand-ink ${v.status === "member" ? "ring-2 ring-[#F5A524] ring-offset-2 ring-offset-bg-card" : ""}`}>{initial}</span>
      ) : (
        <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      )}
    </Link>
  );
}
