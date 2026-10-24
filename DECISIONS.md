# Decisions

## 2026-10-23: Skip builds that can't change the site

Every push to the production branch rebuilt ~10,800 static pages, docs-only commits included.
`scripts/vercel-ignore-build.sh` (vercel.json `ignoreCommand`) now skips non-production builds and
commits touching only docs, README/COST/DECISIONS or `.github/`. Data commits still build, because the
pages are generated from `data/`.

## 2026-10-23: Analytics counts real visitors only

Web Analytics is billed per event. `src/components/SiteAnalytics.tsx` keeps @vercel/analytics but drops
events from localhost, `*.vercel.app` previews, automated browsers, bot user agents and the owner
(`?notrack=1` sets a localStorage flag). It is mounted once, in the root layout.

## 2026-10-23: Block SEO scrapers in robots.txt

SEO-tool and bulk crawlers (Ahrefs, Semrush, MJ12, DotBot, Petal, Bytespider, DataForSeo, BLEX, CCBot,
barkrowler, Seekport) send no visitors. They are disallowed; search engines are not. `/admin` and
`/api/` are disallowed for everyone. robots.txt is advisory, so the Vercel Firewall's bot rules do the
enforcing (see COST.md).

## 2026-10-24: One "buy_click" event per store click

Every outbound store or marketplace link carries `data-buy="<retailer>"` (plus product, price, kind and
rank where known). One capturing listener in `SiteAnalytics.tsx` sends a Vercel Analytics custom event
`buy_click` with those properties, so Analytics → Events shows which retailers people click through to.
It uses the same real-visitor filter as pageviews, and middle-clicks count too. One listener rather than
an onClick per link keeps server components (EbayStrip, brands page) server-only.
