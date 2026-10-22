import type { PriceCheck } from "@/lib/price-check";
import { shortDate } from "@/lib/price-check";
import { Sparkline } from "./Sparkline";

const TONE = {
  lowest: { tone: "save", badge: "bg-save text-white", label: "Real deal" },
  below: { tone: "save", badge: "bg-save-soft text-save", label: "Good price" },
  usual: { tone: "brand", badge: "bg-brand-soft text-brand", label: "Usual price" },
  above: { tone: "hot", badge: "bg-hot/10 text-hot", label: "Wait if you can" },
  new: { tone: "brand", badge: "bg-bg-sunk text-ink-soft", label: "New" },
} as const;

/** The "is this a real deal?" card that sits beside the best price. */
export function PriceCheckCard({ check, onOpenHistory }: { check: PriceCheck; onOpenHistory?: () => void }) {
  const t = TONE[check.verdict];
  return (
    <div className="card flex min-w-0 flex-1 items-center gap-4 p-3.5 sm:max-w-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.badge}`}>{t.label}</span>
          <span className="eyebrow !text-[10px]">Price check</span>
        </div>
        <div className="mt-1 text-sm font-semibold leading-snug">{check.headline}</div>
        <p className="mt-0.5 text-xs leading-snug text-ink-mute">{check.detail}</p>
        {onOpenHistory && (
          <button onClick={onOpenHistory} className="mt-1 text-xs font-semibold text-brand hover:underline">See full history ↓</button>
        )}
      </div>
      <div className="w-24 shrink-0 sm:w-28">
        <Sparkline points={check.points} tone={t.tone} className="h-12 w-full" />
        <div className="mt-1 flex justify-between text-[9px] text-ink-mute">
          <span>{shortDate(check.points[0][0])}</span>
          <span>today</span>
        </div>
      </div>
    </div>
  );
}
