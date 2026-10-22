import Link from "next/link";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
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
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Compare Empire home">
      <LogoMark />
      <span className="font-display text-[1.15rem] font-extrabold tracking-tight">
        Compare<span className="text-brand">Empire</span>
      </span>
    </Link>
  );
}
