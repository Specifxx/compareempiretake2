"use client";
import { compare } from "@/lib/store";
import { CheckIcon, CompareIcon } from "./icons";

export function CompareToggle({ slug, block }: { slug: string; block?: boolean }) {
  const list = compare.use();
  const on = list.includes(slug);
  const full = !on && list.length >= compare.max;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!full) compare.toggle(slug);
      }}
      disabled={full}
      title={full ? `Compare up to ${compare.max} phones` : undefined}
      className={
        block
          ? `btn-ghost ${on ? "!border-brand text-brand" : ""}`
          : `inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition ${on ? "bg-brand-soft text-brand" : "text-ink-mute hover:text-ink"} disabled:opacity-40`
      }
    >
      {on ? <CheckIcon className="h-3.5 w-3.5" /> : <CompareIcon className="h-3.5 w-3.5" />}
      {on ? "Comparing" : "Compare"}
    </button>
  );
}
