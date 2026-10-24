"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { track } from "@vercel/analytics";
import { useEffect } from "react";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|python|curl|wget|httpclient|phantom|puppeteer|playwright/i;
const KEY = "va-disable";

function optedOut(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Vercel Web Analytics, counting real visitors only: no previews, localhost, bots or the owner (visit any page with ?notrack=1; ?notrack=0 undoes it). Also sends a "buy_click" event, with the retailer, for every store link clicked. */
function countable(): boolean {
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return false;
  return !navigator.webdriver && !BOT.test(navigator.userAgent) && !optedOut();
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  return countable() ? event : null;
}

export function SiteAnalytics() {
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("notrack");
    try {
      if (v === "1") localStorage.setItem(KEY, "1");
      else if (v === "0") localStorage.removeItem(KEY);
    } catch {}
  }, []);
  // One listener for every store link: <a data-buy="<retailer>" data-buy-product data-buy-price data-buy-kind data-buy-rank>.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button > 1) return;
      const a = (e.target as Element | null)?.closest?.("a[data-buy]") as HTMLAnchorElement | null;
      if (!a || !countable()) return;
      const d = a.dataset;
      const props: Record<string, string | number> = { retailer: d.buy!, kind: d.buyKind ?? "store", page: location.pathname };
      if (d.buyProduct) props.product = d.buyProduct;
      if (d.buyPrice && !Number.isNaN(Number(d.buyPrice))) props.price = Math.round(Number(d.buyPrice));
      if (d.buyRank) props.rank = Number(d.buyRank);
      track("buy_click", props);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);
  return <Analytics beforeSend={beforeSend} />;
}
