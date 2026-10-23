"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** Landing page for alert emails: confirm (button), unsubscribed, or a bad link. */
export function AlertStatus() {
  const q = useSearchParams();
  const confirmToken = q.get("confirm");
  const status = q.get("status");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [done, setDone] = useState<{ product: string; name: string; target: number } | null>(null);

  if (confirmToken) {
    const go = async () => {
      setState("busy");
      const r = await fetch("/api/alerts/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: confirmToken }) }).catch(() => null);
      const j = r?.ok ? await r.json() : null;
      if (j?.ok) {
        setDone(j);
        setState("done");
      } else setState("error");
    };
    if (state === "done" && done)
      return (
        <Box title="Your price alert is on 🔔">
          We&apos;ll email you when <b>{done.name}</b> is <b>${done.target.toLocaleString("en-AU")}</b> or less at any store we check. Prices are checked every morning.
          <div className="mt-6"><Link href={done.product} className="btn-primary">Back to {done.name}</Link></div>
        </Box>
      );
    return (
      <Box title="Confirm your price alert">
        One click and you&apos;re set. We&apos;ll only email you when the price drops to your target.
        <div className="mt-6">
          <button onClick={go} disabled={state === "busy"} className="btn-primary">{state === "busy" ? "Confirming…" : "Confirm my alert"}</button>
        </div>
        {state === "error" && <p className="mt-3 text-sm text-hot">That link has expired or was already used. Set a new alert from any product page.</p>}
      </Box>
    );
  }
  if (status === "unsubscribed")
    return <Box title="You're unsubscribed">That alert is off and we won&apos;t email you about it again. Set a new one any time from a product page.</Box>;
  return <Box title="Price alerts">Open any product and tap <b>“Alert me when it drops”</b> to get an email when it hits your price.</Box>;
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="font-display text-2xl font-extrabold">{title}</h1>
      <div className="mt-3 text-ink-soft">{children}</div>
    </div>
  );
}
