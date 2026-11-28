"use client";

import { usePremium } from "./usePremium";
import { SignIn } from "./SignIn";
import { AccountHub } from "./AccountHub";

/** /account: the sign-in panel signed out, the member's hub signed in. Browser only: the one CDN copy is the same for everyone. */
export function AccountPage() {
  const v = usePremium();
  if (v.status === "loading") return <div className="card h-80 animate-pulse" aria-busy="true" aria-label="Loading your account" />;
  if (v.status === "out") return <SignIn />;
  return <AccountHub info={v.info} />;
}
