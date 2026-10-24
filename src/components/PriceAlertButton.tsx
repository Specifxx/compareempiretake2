"use client";
import { useState } from "react";
import Link from "next/link";
import { useRegionKit } from "@/lib/use-region";

/** "Alert me when it drops": email + target price, confirmed by email before it goes live. */
export function PriceAlertButton({ product, productName, variant, variantLabel, price }: { product: string; productName: string; variant: string; variantLabel?: string; price: number }) {
  const { $ } = useRegionKit();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(() => String(Math.floor((price * 0.95) / 10) * 10 || Math.floor(price)));
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value;
    setState({ kind: "busy" });
    const r = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, product, productName, variant, variantLabel, price, target: Number(target), website: hp }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok && j.ok) setState({ kind: "ok", msg: j.updated ? "Updated — we'll email you at your new price." : "Check your inbox and tap “Confirm” to switch the alert on." });
    else setState({ kind: "error", msg: j.error ?? "Something went wrong. Please try again." });
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost">
        🔔 Alert me when it drops
      </button>
    );
  return (
    <form onSubmit={submit} className="card w-full p-4 animate-fade-up">
      <div className="font-semibold">Email me when {productName}{variantLabel ? ` (${variantLabel})` : ""} drops</div>
      <p className="mt-0.5 text-xs text-ink-mute">Today&apos;s best price is {$(price)}. We check every store each morning and email you once it hits your price.</p>
      {state.kind === "ok" ? (
        <p className="mt-3 rounded-xl bg-save-soft px-3 py-2 text-sm font-medium text-save">{state.msg}</p>
      ) : (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="flex h-11 items-center gap-1 rounded-xl border border-line bg-bg px-3 text-sm sm:w-40">
              <span className="text-ink-mute">$</span>
              <input value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" aria-label="Alert price" className="w-full bg-transparent outline-none" />
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand" />
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <button className="btn-primary" disabled={state.kind === "busy"}>{state.kind === "busy" ? "Saving…" : "Set alert"}</button>
          </div>
          {state.kind === "error" && <p className="mt-2 text-sm text-hot">{state.msg}</p>}
          <p className="mt-2 text-[11px] text-ink-mute">We only use your email for this alert. Every email has a one-click unsubscribe. <Link href="/privacy" className="underline">Privacy</Link></p>
        </>
      )}
    </form>
  );
}
