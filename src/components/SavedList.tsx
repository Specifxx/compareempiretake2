"use client";
import Link from "next/link";
import type { PhoneSummary } from "@/lib/catalog";
import { saved } from "@/lib/store";
import { PhoneCard } from "./PhoneCard";

export function SavedList({ phones }: { phones: PhoneSummary[] }) {
  const list = saved.use();
  // Early saves were bare phone slugs; newer ones are full product paths.
  const mine = list.map((s) => phones.find((p) => p.href === (s.startsWith("/") ? s : `/phones/${s}`))).filter(Boolean) as PhoneSummary[];
  if (!mine.length)
    return (
      <div className="card px-6 py-16 text-center">
        <div className="font-display text-xl font-bold">Nothing saved yet</div>
        <p className="mt-2 text-sm text-ink-mute">Tap the heart on anything to keep an eye on its price. Saved phones live in this browser — no account needed.</p>
        <Link href="/phones" className="btn-primary mt-6">Browse phones</Link>
      </div>
    );
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{mine.map((p) => <PhoneCard key={p.href} p={p} showCategory />)}</div>;
}
