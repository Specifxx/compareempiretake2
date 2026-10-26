"use client";
import { compareGroup } from "@/lib/product-refs";
import { compare } from "@/lib/store";
import { CheckIcon, CompareIcon } from "./icons";

export function CompareToggle({ slug, block }: { slug: string; block?: boolean }) {
  const list = compare.use();
  const on = list.includes(slug);
  // One region and category at a time ("us/tvs"): the compare table's rows and prices are its first product's.
  const first = list.map(compareGroup).find((g): g is string => !!g);
  const mine = compareGroup(slug);
  const otherCategory = !on && !!first && first !== mine;
  const otherRegion = otherCategory && first?.split("/")[0] !== mine?.split("/")[0];
  const full = (!on && list.length >= compare.max) || otherCategory;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!full) compare.toggle(slug);
      }}
      disabled={full}
      title={
        otherRegion
          ? "Your compare list has products from another country — clear it first"
          : otherCategory
            ? "Your compare list has a different category — clear it first"
            : full
              ? `Compare up to ${compare.max} products`
              : undefined
      }
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
