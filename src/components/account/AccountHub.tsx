"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMyAlerts, untilLine, writeStored, trackPremium, type MyAlert, type StoredPremium } from "@/lib/premium-member";
import { money, regionOf } from "@/lib/region";
import { saved } from "@/lib/store";

type Load<T> = { s: "loading" } | { s: "ok"; v: T } | { s: "error" };

function Tile({ href, label, value, sub, gold = false }: { href: string; label: string; value: string; sub: string; gold?: boolean }) {
  return (
    <Link prefetch={false} href={href} className={`card flex min-h-[7.5rem] flex-col p-4 transition hover:shadow-lift sm:p-5 ${gold ? "border-[#F5A524]/60 bg-[#F5A524]/[0.07]" : ""}`}>
      <span className="eyebrow">{label}</span>
      <span className="mt-auto text-2xl font-bold tabular-nums tracking-tight">{value}</span>
      <span className="text-sm text-ink-mute">{sub}</span>
    </Link>
  );
}

/** Signed in on /account: who you are, your price alerts (from our own table, checked by token), your saved list and Premium. */
export function AccountHub({ info }: { info: StoredPremium }) {
  const member = info.premium;
  const savedList = saved.use();
  const [alerts, setAlerts] = useState<Load<MyAlert[]>>({ s: "loading" });
  const [stopping, setStopping] = useState<string | null>(null);

  function apply(r: Awaited<ReturnType<typeof loadMyAlerts>>) {
    if (r.kind === "invalid") {
      writeStored(null);
      location.reload();
      return;
    }
    setAlerts(r.kind === "ok" ? { s: "ok", v: r.alerts } : { s: "error" });
  }

  useEffect(() => {
    trackPremium("profile_view", { premium: member });
    loadMyAlerts(info.t).then(apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.t]);

  async function stop(id: string) {
    setStopping(id);
    apply(await loadMyAlerts(info.t, id));
    setStopping(null);
  }

  const list = alerts.s === "ok" ? alerts.v : [];
  const live = list.filter((a) => a.live).length;

  return (
    <div className="grid gap-4">
      <section className="card overflow-hidden">
        <div className="h-14 bg-brand sm:h-16" />
        <div className="-mt-8 flex flex-wrap items-end gap-3 px-5 pb-5 sm:px-6">
          <span aria-hidden className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-4 border-bg-card bg-ink text-2xl font-bold text-bg-card shadow-lift ${member ? "ring-2 ring-[#F5A524]" : ""}`}>
            {(info.who.trim()[0] || "•").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 pb-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Your account</h1>
            <p className="truncate text-sm text-ink-mute">{info.who ? `Signed in as ${info.who}` : "Signed in"}</p>
          </div>
          <span className={`chip ${member ? "border-[#F5A524]/60 text-ink" : ""}`}>{member ? "★ Premium" : "Free account"}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile href="#alerts" label="Price alerts" value={alerts.s === "ok" ? String(list.length) : "–"} sub={alerts.s === "ok" ? `${live} live` : alerts.s === "error" ? "Couldn't load" : "Loading…"} />
        <Tile href="/saved" label="Saved" value={String(savedList.length)} sub="On this device" />
        <div className="col-span-2 lg:col-span-1">
          <Tile href="/premium" label="Premium" value={member ? "Active" : "Free plan"} sub={member ? (untilLine(info.until) ? `Renews or ends ${untilLine(info.until)}` : "No banner ads") : "No banner ads · 14 days free"} gold={member} />
        </div>
      </div>

      <section id="alerts" className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby="alerts-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="alerts-h" className="text-lg font-bold">Your price alerts</h2>
          <span className="text-xs text-ink-mute">We check every store each morning</span>
        </div>
        {alerts.s === "loading" && <p className="mt-3 text-sm text-ink-mute">Loading your alerts…</p>}
        {alerts.s === "error" && <p className="mt-3 text-sm text-hot">We couldn&apos;t load your alerts just now. Try again in a minute.</p>}
        {alerts.s === "ok" && list.length === 0 && (
          <div className="mt-3 rounded-lg bg-bg-sunk p-4 text-sm">
            <p className="font-semibold">No alerts yet</p>
            <p className="mt-1 text-ink-mute">On any product page, tap <b className="text-ink">Alert me when it drops</b> and pick your price. Signed in, it&apos;s on straight away.</p>
          </div>
        )}
        {list.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {list.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <Link prefetch={false} href={a.path} className="font-semibold hover:underline">{a.name}</Link>
                  {a.option && <span className="text-sm text-ink-mute"> · {a.option}</span>}
                  <p className="text-sm text-ink-mute">
                    At {money(a.target, regionOf(a.path))} or less · {a.live ? <span className="font-medium text-save">Live</span> : <span>Waiting for you to confirm the email we sent</span>}
                  </p>
                </div>
                <button type="button" onClick={() => stop(a.id)} disabled={stopping === a.id} className="btn-ghost min-h-9 px-3 py-1.5 text-sm">
                  {stopping === a.id ? "Stopping…" : "Stop"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!member && (
        <Link prefetch={false} href="/premium" onClick={() => trackPremium("profile_premium_click", {})} className="block rounded-lg bg-ink p-5 text-bg-card sm:p-6">
          <span className="block text-xs font-bold uppercase tracking-widest text-[#F5A524]">★ Premium · 14 days free</span>
          <span className="mt-1 block text-lg font-bold">A calmer Compare Empire: no banner ads</span>
          <span className="mt-1 block text-sm opacity-80">US$4.99 a month or US$39.99 a year. Comparing prices stays free for everyone.</span>
        </Link>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-ink-mute">
        <span>One free account for all our price comparison sites.</span>
        <button type="button" className="underline hover:text-ink" onClick={() => { writeStored(null); location.reload(); }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
