import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { HOME_PATH, isNeutralPath, REGION_BOOT_SCRIPT, regionFromTimeZone, regionOf, withRegion, withXDefault } from "../src/lib/region";

// Owner, 2026-11-01: the default region is the visitor's own, the US when we can't tell; the root is the US home.

test("the root is the US home, Australia's home is /au, and every other page keeps its URL", () => {
  assert.deepEqual(HOME_PATH, { au: "/au", us: "/", uk: "/uk" });
  assert.equal(regionOf("/"), "us");
  assert.equal(regionOf("/au"), "au");
  assert.equal(regionOf("/phones"), "au");
  assert.equal(regionOf("/phones/apple-iphone-17"), "au");
  assert.equal(regionOf("/us/phones"), "us");
  assert.equal(regionOf("/uk"), "uk");
  assert.equal(withRegion("/", "us"), "/");
  assert.equal(withRegion("/", "au"), "/au");
  assert.equal(withRegion("/", "uk"), "/uk");
  assert.equal(withRegion("/phones", "au"), "/phones");
  assert.equal(withRegion("/phones", "us"), "/us/phones");
  assert.match(readFileSync("next.config.mjs", "utf8"), /source: "\/us", destination: "\/", permanent: true/);
});

test("a time zone we don't cover is the US", () => {
  assert.equal(regionFromTimeZone("Australia/Sydney"), "au");
  assert.equal(regionFromTimeZone("Europe/London"), "uk");
  assert.equal(regionFromTimeZone("America/Chicago"), "us");
  assert.equal(regionFromTimeZone("Asia/Tokyo"), "us");
  assert.equal(regionFromTimeZone("Europe/Paris"), "us");
  assert.equal(regionFromTimeZone(""), "us");
  assert.ok(isNeutralPath("/about") && isNeutralPath("/forum/x") && !isNeutralPath("/phones") && !isNeutralPath("/"));
});

test("x-default is the US copy", () => {
  assert.deepEqual(withXDefault({ "en-AU": "/phones", "en-US": "/us/phones" }), { "en-AU": "/phones", "en-US": "/us/phones", "x-default": "/us/phones" });
  assert.deepEqual(withXDefault({ "en-AU": "/phones" }), { "en-AU": "/phones" });
});

type Run = { path: string; tz?: string; saved?: string; ua?: string; alternates?: Record<string, string> };
function boot({ path, tz = "America/New_York", saved, ua = "Mozilla/5.0 (iPhone) Safari/604.1", alternates = {} }: Run) {
  const attrs: Record<string, string> = {};
  let moved: string | null = null;
  const session: Record<string, string> = {};
  const ctx = {
    URL,
    navigator: { userAgent: ua },
    location: { pathname: path, search: "?x=1", hash: "", href: `https://compareempire.com${path}`, replace: (u: string) => (moved = u) },
    localStorage: { getItem: () => saved ?? null },
    sessionStorage: { getItem: (k: string) => session[k] ?? null, setItem: (k: string, v: string) => (session[k] = v) },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: tz }) }) },
    setTimeout: () => 0,
    document: {
      readyState: "complete",
      documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: (k: string) => delete attrs[k] },
      querySelector: (sel: string) => {
        const lang = /hreflang="([^"]+)"/.exec(sel)?.[1] ?? "";
        return alternates[lang] ? { href: `https://compareempire.com${alternates[lang]}` } : null;
      },
    },
  };
  vm.runInNewContext(REGION_BOOT_SCRIPT, ctx);
  return { moved, attrs };
}

test("a visitor is moved to their own region's copy of the page; crawlers never are", () => {
  const alts = { "en-AU": "/phones", "en-US": "/us/phones", "en-GB": "/uk/phones" };
  assert.equal(boot({ path: "/phones", alternates: alts }).moved, "/us/phones?x=1", "US visitor on an Australian page");
  assert.equal(boot({ path: "/phones", tz: "Asia/Tokyo", alternates: alts }).moved, "/us/phones?x=1", "unknown → US");
  assert.equal(boot({ path: "/us/phones", tz: "Australia/Perth", alternates: alts }).moved, "/phones?x=1", "Australian visitor on a US page");
  assert.equal(boot({ path: "/", tz: "Australia/Perth", alternates: { "en-AU": "/au", "en-US": "/" } }).moved, "/au?x=1", "Australian visitor on the root");
  assert.equal(boot({ path: "/us/phones", tz: "Australia/Perth", saved: "us", alternates: alts }).moved, null, "a region picked in the header wins");
  assert.equal(boot({ path: "/phones", saved: "uk", alternates: alts }).moved, "/uk/phones?x=1");
  assert.equal(boot({ path: "/us/phones", alternates: alts }).moved, null, "already in their region");
  const bot = boot({ path: "/phones", ua: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) Chrome/120 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", alternates: alts });
  assert.equal(bot.moved, null, "Googlebot stays");
  assert.equal(bot.attrs["data-geo"], undefined, "and nothing is hidden from it");
  const miss = boot({ path: "/guides/best-phones", alternates: {} });
  assert.equal(miss.moved, null, "no copy in their region: stay");
  assert.equal(miss.attrs["data-geo-miss"], "us");
  assert.equal(miss.attrs["data-geo"], undefined, "content shown again");
  assert.equal(boot({ path: "/about", tz: "Australia/Sydney" }).moved, null, "pages of no region never move");
  assert.doesNotThrow(() => vm.runInNewContext(REGION_BOOT_SCRIPT, {}));
});

test("the layout runs the region script before paint and names no country by default", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /__html: REGION_BOOT_SCRIPT/);
  assert.match(layout, /<html lang="en"/);
  assert.doesNotMatch(/title: \{ default: "[^"]*"/.exec(layout)?.[0] ?? "", /Australia/);
  assert.match(readFileSync("src/app/globals.css", "utf8"), /html\[data-geo="pending"\] main \{ visibility: hidden; \}/);
});
