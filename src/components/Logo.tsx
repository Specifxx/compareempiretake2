"use client";
import { useRegion } from "@/lib/use-region";
import { REGIONS } from "@/lib/region";
import Link from "next/link";

// At Christmas Santa's hat sits on it (globals.css .xmas-logo-hat, hidden outside the season), hence the host span.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className="xmas-hat-host">
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <defs>
          <linearGradient id="ce-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#4A2FE0" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#ce-g)" />
        <path d="M14 43V22l9 8 9-12 9 12 9-8v21z" fill="#fff" />
        <rect x="14" y="46.5" width="36" height="5" rx="2.5" fill="#fff" opacity=".65" />
      </svg>
      <span aria-hidden="true" className="xmas-logo-hat" />
    </span>
  );
}

export function Logo() {
  const region = useRegion();
  return (
    <Link href={REGIONS[region].prefix || "/"} className="flex items-center gap-2.5" aria-label="Compare Empire home">
      <LogoMark />
      <span className="font-display text-[1.15rem] font-extrabold tracking-tight">
        Compare<span className="text-brand">Empire</span>
      </span>
    </Link>
  );
}
