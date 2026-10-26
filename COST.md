# Vercel cost: compareempire.com (compareempiretake2)

Measured 2026-10-23. No Vercel API token or dashboard access was available, so per-project
usage (ISR writes, origin transfer, CPU) and the bot share could NOT be measured. This is a
code audit plus `curl` against production.

## What we measured

| Path | Cache | Size (raw / compressed) |
|---|---|---|
| `/` | `x-vercel-cache: HIT` (static, age ~4 h) | 315,685 B / 28,238 B |
| `/phones` | HIT (static) | 168,692 B / 25,258 B |
| `/search-index.json` | PRERENDER, then HIT | 3,396,110 B / 561,224 B, fetched only when search opens |
| `/og?...` | MISS, then HIT (edge, `max-age=86400`) | n/a |
| `/robots.txt` | HIT | 88 B |

## Findings

- **No ISR, no `unstable_cache`, no `revalidateTag`, no middleware.** All ~10,800 pages are static
  HTML built from JSON in the repo; `images.unoptimized` is already on. The project is unlikely to be a
  main source of the team's ISR Writes or Active CPU lines.
- The cost it does cause is **builds**: every push to the production branch rebuilt all ~10,800 pages,
  including commits that changed only docs or workflows.
- Web Analytics counted every pageview, including bots, previews and the owner.

## Changes

1. `vercel.json` `ignoreCommand` (`scripts/vercel-ignore-build.sh`): skip non-production builds and
   commits that touch only `docs/`, `README.md`, `COST.md`, `DECISIONS.md` or `.github/`.
2. `<SiteAnalytics />` (mounted once, in the root layout) adds `beforeSend` that drops events from
   localhost, `*.vercel.app` previews, `navigator.webdriver`, bot user agents, and the owner after
   visiting any page with `?notrack=1` (`?notrack=0` undoes it). No custom events are sent.
   @vercel/speed-insights was never installed.
3. `robots.txt`: `/admin` and `/api/` disallowed for everyone; SEO-tool and bulk scrapers (AhrefsBot,
   SemrushBot, MJ12bot, DotBot, PetalBot, Bytespider, DataForSeoBot, BLEXBot, CCBot, barkrowler,
   SeekportBot) disallowed entirely. Googlebot, Bingbot and other search engines are unchanged.

Event counts before and after can't be measured here; check Vercel → Analytics → Events after a week.

## Not changed

- The sitemap URL in robots.txt is `https://compareempire.com/sitemap.xml` (apex, which redirects to
  www). It works, but setting `NEXT_PUBLIC_SITE_URL=https://www.compareempire.com` in Vercel would
  remove the redirect hop. Left alone: the brief said no SEO changes.

## 2026-10-26: product pages are functions cached at the CDN

Product pages (`/<category>/<slug>`, `/us/…`, `/uk/…`, about 28,200 URLs) are no longer prerendered:
each renders on its first request and Vercel's CDN keeps it for a day, reset by every deploy
(`next.config.mjs`, DECISIONS 2026-10-26). Builds drop from ~29,000 pages to ~860.

- **ISR writes must stay 0.** Nothing uses `revalidate`, `unstable_cache` or on-demand ISR
  (`tests/routes.test.ts`). Any ISR write in the usage page means something regressed.
- **Watch Active CPU and function invocations for a week.** A CDN miss costs one render (about 14 ms
  warm; a cold instance first parses ~53 MB of JSON, 0.5–1.5 s). Each product URL misses once per CDN
  region per deploy. IndexNow (`scripts/indexnow.ts`) sends Bingbot up to 10,000 product URLs a day,
  and every one it fetches after a deploy is a miss.
- Prefetch is off on every product link, so grids and `/browse` don't invoke functions by scrolling.
  Client-side navigations to a product page still fetch its RSC payload, keyed by the page they start
  from, so most of those are misses too: check their share of invocations.
- Junk two-segment URLs (`/wp-admin/x.php`) are now an uncached function 404 instead of a static one,
  and so is every query-string variant of a product URL (`?v=`, `utm_*`, `gclid`): each is its own
  CDN key and its own render. Add a Vercel Firewall rule if probes or tracking parameters show up as a
  meaningful share of invocations; not middleware, which would itself run on every request.
- Function 404s (unknown products, junk paths) have an empty body without JavaScript (Next's error
  shell); status and `noindex` are right. DECISIONS 2026-10-26.
- **Which plan?** On Pro this is a small line. On Hobby, a daily crawl of ~24,000 long-tail product
  URLs, each a miss after every deploy (~720k invocations a month per crawler and CDN region, ~6 h
  Active CPU, ~17 GB compressed origin transfer), would be near or over Hobby's 1M invocations, 4 h
  Active CPU and 10 GB Fast Origin Transfer. Confirm the plan, and if it's Hobby or the numbers run
  well above this, shrink the crawl surface (`SITEMAP_TIER`, IndexNow) before anything else.
- **Each deploy empties the CDN**, and every crawled product then renders once more per CDN region.
  Cheap builds make extra pushes tempting: keep pushes to the production branch batched.

## 2026-10-26: grids, compare and saved load their data separately

`/compare` (19.6 MB) and `/saved` (8.2 MB) no longer embed the catalogue, and category and brand grids send
one page of 48 (DECISIONS 2026-10-26, "No prerendered page carries a catalogue").

- **`/api/grid/…`** (89 static JSON files, largest 1.84 MB / 264 KB gzipped) are prerendered with the
  deploy: CDN hits, no function. A category visitor downloads its file once the page is idle, so per-visit
  transfer is about what the inlined list used to be, but the HTML is 5–15x smaller.
- **`/api/products`** is a new function: one invocation per distinct query per CDN region per deploy
  (`Vercel-CDN-Cache-Control: s-maxage=86400`). Only `/compare` and `/saved` call it, and `robots.txt`
  disallows `/api/`. If it ever shows up as a real share of invocations, look at the query mix first.
