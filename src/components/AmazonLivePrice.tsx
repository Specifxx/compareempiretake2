"use client";
/**
 * Amazon's price from the Creators API, with the time it was fetched and Amazon's disclaimer, as its licence
 * requires. Pages sit in the CDN for hours, so the browser checks the age again: past 24 hours the price gives
 * way to nothing (the row still says "Check price on Amazon" through its button) rather than a stale number.
 */
import { useEffect, useState } from "react";

const MAX_AGE_MS = 24 * 3600_000;
export const AMAZON_PRICE_DISCLAIMER =
  "Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon at the time of purchase will apply to the purchase of this product.";

const asOf = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function AmazonLivePrice({ text, at }: { text: string; at: string }) {
  const [fresh, setFresh] = useState(true);
  useEffect(() => setFresh(Date.now() - Date.parse(at) < MAX_AGE_MS), [at]);
  if (!fresh) return null;
  return (
    <span className="shrink-0 text-right" title={AMAZON_PRICE_DISCLAIMER}>
      <span className="block font-display text-lg font-bold">{text}</span>
      <span className="block text-[10px] text-ink-mute">as of {asOf(at)} Sydney time*</span>
    </span>
  );
}
