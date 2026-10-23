"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
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

/** Vercel Web Analytics, counting real visitors only: no previews, localhost, bots or the owner (visit any page with ?notrack=1; ?notrack=0 undoes it). */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return null;
  if (navigator.webdriver || BOT.test(navigator.userAgent)) return null;
  if (optedOut()) return null;
  return event;
}

export function SiteAnalytics() {
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("notrack");
    try {
      if (v === "1") localStorage.setItem(KEY, "1");
      else if (v === "0") localStorage.removeItem(KEY);
    } catch {}
  }, []);
  return <Analytics beforeSend={beforeSend} />;
}
