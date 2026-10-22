"use client";
import { saved } from "@/lib/store";
import { HeartIcon } from "./icons";

export function SaveButton({ slug, className = "", label }: { slug: string; className?: string; label?: boolean }) {
  const list = saved.use();
  const on = list.includes(slug);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        saved.toggle(slug);
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save phone"}
      className={`${label ? "btn-ghost" : "grid h-9 w-9 place-items-center rounded-full bg-bg-card/90 shadow-sm backdrop-blur"} ${on ? "text-hot" : "text-ink-mute hover:text-hot"} ${className}`}
    >
      <HeartIcon className="h-[18px] w-[18px]" filled={on} />
      {label && <span className="text-ink">{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
