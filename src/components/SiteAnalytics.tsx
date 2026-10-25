"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { track } from "@vercel/analytics";
import Script from "next/script";
import { useEffect, useState } from "react";

/** GA4 measurement id (G-XXXX). GA4 loads only when it is set, and only for real visitors. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

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
      // Amazon Associates: a GA4 event per outbound Amazon click, to see which products and placements convert.
      if (d.buy === "amazon")
        window.gtag?.("event", "amazon_click", {
          product: d.buyProduct ?? "",
          placement: d.amazon ?? d.buyKind ?? "",
          page_path: location.pathname,
          link_url: a.href,
          transport_type: "beacon",
        });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);
  const [ga, setGa] = useState(false);
  useEffect(() => setGa(Boolean(GA_ID) && countable()), []);
  return (
    <>
      <Analytics beforeSend={beforeSend} />
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
