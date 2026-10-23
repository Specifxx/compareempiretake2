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
