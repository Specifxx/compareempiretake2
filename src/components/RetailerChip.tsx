import { RETAILERS } from "@/lib/retailers";
import type { RetailerId } from "@/lib/types";

export function RetailerDot({ id, className = "h-2.5 w-2.5" }: { id: RetailerId; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ring-1 ring-black/10 ${className}`} style={{ background: RETAILERS[id].color }} />;
}

export function RetailerName({ id }: { id: RetailerId }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <RetailerDot id={id} />
      {RETAILERS[id].name}
    </span>
  );
}
