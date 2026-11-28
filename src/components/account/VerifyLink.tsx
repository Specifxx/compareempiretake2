"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { codeFromHash, signInWithCode, trackPremium } from "@/lib/premium-member";

/** Where to land: the page the visitor was headed to (Google or Discord carry it as &n=), else the account page. */
function landing(hash: string): string {
  const n = /[#&]n=([^&]+)/.exec(hash)?.[1];
  const p = n ? decodeURIComponent(n) : "";
  return /^\/(?!\/)[\w\-/?=&.]*$/.test(p) ? p : "/account";
}

/** /account/verify: the emailed link's code is in the fragment (never sent to our server or logged); trade it for a sign-in. */
export function VerifyLink() {
  const [msg, setMsg] = useState("Signing you in…");
  useEffect(() => {
    const c = codeFromHash(location.hash);
    const to = landing(location.hash);
    history.replaceState(null, "", location.pathname);
    if (!c) {
      setMsg("That sign-in link isn't valid. Ask for a new one.");
      return;
    }
    signInWithCode(c).then((r) => {
      if (r.ok) {
        trackPremium("signed_in", { how: "link" });
        location.replace(to);
      } else setMsg(r.message);
    });
  }, []);
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <p aria-live="polite">{msg}</p>
      {msg !== "Signing you in…" && (
        <Link prefetch={false} href="/account" className="btn-primary mt-4">
          Back to sign in
        </Link>
      )}
    </div>
  );
}
