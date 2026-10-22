"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { compare } from "@/lib/store";
import { CloseIcon } from "./icons";

export function CompareTray() {
  const list = compare.use();
  const path = usePathname();
  if (!list.length || path.startsWith("/compare")) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 animate-fade-up">
      <div className="card flex items-center gap-3 py-2 pl-4 pr-2 shadow-lift">
        <span className="text-sm font-medium">
          {list.length} {list.length === 1 ? "phone" : "phones"} to compare
        </span>
        <button onClick={compare.clear} className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute hover:bg-bg-sunk" aria-label="Clear compare">
          <CloseIcon className="h-4 w-4" />
        </button>
        <Link href={`/compare?p=${list.join(",")}`} className="btn-primary py-2">
          Compare now
        </Link>
      </div>
    </div>
  );
}
