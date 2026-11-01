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

## 2026-10-25: Amazon Associates (AU) links, without Amazon prices

To earn the three qualifying sales Amazon requires before approving the Associates account
(tag `compareempire-22`, overridable with `AMAZON_AU_TAG`), every Amazon AU link is built by
`amazonAuLink()` in `src/lib/amazon.ts`: `/dp/<ASIN>` when we know one, otherwise an amazon.com.au
search, always straight to Amazon with our tag (no shortener or redirect) and
`rel="sponsored nofollow noopener"`. Our data has no ASINs yet, so links are searches for the
product name. We show no Amazon price, rating or stock (that needs the Product Advertising API, which
comes after approval); buttons say "Check price on Amazon". Placements, all Australia only: a labelled
"Amazon AU" row under the store list on product pages, a row in the compare table, a search link in
the search box, and "Top picks on Amazon AU" on the home page and eight top categories. The footer
carries Amazon's required sentence on every page, `/affiliate-disclosure` explains it, and the first
Amazon link on a page has the short disclosure beside it. Clicks send `buy_click` (Vercel) and, once
`NEXT_PUBLIC_GA_ID` is set, a GA4 `amazon_click` event with product, placement and page.

## 2026-10-25: eBay prices: spend 5,000 calls on the products people click

The eBay Browse API (5,000 calls a day) runs once a day in the price job (`scripts/ebay-prices.ts`),
never from a page. Keys live only in GitHub secrets (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`). It
spends 4,950 searches, one per product, on products with a best price of at least 10 in their currency.
About 28,700 products qualify across AU, US and UK, so it ranks them by demand (stores stocking it,
newness, category weight, price, and a US boost), checks the top quarter of the budget every day and
rotates the rest stalest-first. Each search is new, Buy It Now, in-country, priced within 45–135% of
our best store price, and the listing title must contain the product's identifying words, so cases and
parts don't match. The cheapest passing listing, with eBay's affiliate URL for campaign 5339155912, goes
to `data/<region>/ebay.json`. Listings older than five days are dropped. Product pages show it as a
labelled "eBay · Ad · New" row beside, never among, the store rows, and cards show "eBay $X".

eBay requires a Marketplace Account Deletion endpoint for production keys:
`/api/ebay/account-deletion` answers the challenge with sha256(code + EBAY_VERIFICATION_TOKEN +
endpoint) and acknowledges deletion notices. We store no eBay user data, so there is nothing to delete.

## 2026-10-25: The daily job finishes: stores in parallel, JB Hi-Fi on a time budget

Runs on 23 and 24 Oct were cancelled at the time limit inside the AU category scrape: JB Hi-Fi's
scraper fetched thousands of product JSON files and retried every 429 with backoff. JB now pauses
all its workers together on a 429, stops after 40 minutes (`JB_BUDGET_MIN`), keeps yesterday's file for
any category it couldn't finish, and starts at a different category each day. The runner scrapes
four stores at once.

## 2026-10-25: Indexing: one www host, a tiered sitemap index, and crawlable browse pages

`compareempire.com` already 308-redirects to `www`, but canonicals, OG URLs and the robots.txt
Sitemap line used the bare domain, so every canonical pointed at a redirect. `SITE` now always resolves
to `https://www.compareempire.com` (a bare-domain `NEXT_PUBLIC_SITE_URL` is upgraded).

85% of the ~28K product pages are sold by one store: thin for a brand-new site. `/sitemap.xml` is now
a sitemap index of sections (`/sitemaps/<section>.xml`, `src/lib/seo.ts`). `SITEMAP_TIER` (Vercel env,
default 1) decides what's submitted: tier 1 is hubs, categories, guides and products at 3+ stores
(about 1,470 URLs), tier 2 adds 2-store products, brands, category deals and comparisons, and tier 3
is everything. Raise it once Search Console shows the tier indexed. Pages outside the sitemap stay
live and indexable, and every one is linked from the A-to-Z `/browse/<category>` pages (200 a page,
in every region), because category grids load most products in the browser.

Product pages gained a price summary (cheapest, range, options, lowest recorded, stores in stock),
category "Before you buy" tips, a data-driven FAQ, and BreadcrumbList and FAQPage JSON-LD; product
names that repeat in a region get their model code in the title. Category pages gained a buying guide,
price range, top brands and an FAQ. No ratings or reviews are marked up: we have none of our own.

## 2026-10-26: Product pages render on request, held by Vercel's CDN; the build prerenders hubs only

Deploys took 13–17 minutes and grew with the catalogue (1m10s at 3.9k products on 22 Oct, about
4 min at 10k). `next build` prerendered 29,065 pages; 28,204 were product pages (97%), holding 3.5 of
the 3.94 GB of output, and Vercel then uploaded about 87,000 files. About half of each page's render
was the root layout and Footer rebuilding the nav and footer data for all three regions.

The three product routes (`src/app/[category]/[slug]`, `us/…`, `uk/…`) are now `force-dynamic`: a
product page renders on its first request and Vercel's CDN keeps that copy for a day
(`Vercel-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400`, from
`next.config.mjs`; browsers still get `private, no-store`). Every deploy starts a fresh CDN cache, so a
copy never outlives the data it was rendered from: Vercel's cache key includes the unique deployment
URL (Vercel docs, "Purging Vercel CDN Cache", Cache keys), which also means a cached page only ever
references its own deployment's `/_next/static` chunks. Every other page is prerendered exactly as before,
with `dynamicParams = false`. Measured locally (4 vCPU, cold): 861 pages instead of 29,065,
`.next/server/app` 0.25 GB instead of 3.94 GB (2,738 files instead of 87,350), `next build` 1m08s
instead of 9m14s. Vercel deploys should take about 2–3 min; confirm it from the first one.

The rule: product pages are functions cached at the CDN, and nothing is ISR. No `revalidate`, no
`generateStaticParams` on the product routes, no `unstable_cache`, no middleware, and no data or
workflow change. Not ISR because on-demand ISR would write every crawled product page, and every 404
probe, into the ISR cache once per deploy, and ISR writes were the largest Vercel line on the owner's
other sites. `tests/routes.test.ts` pins it: product routes force-dynamic, every other `[param]` route
`dynamicParams = false`, no `revalidate` or `unstable_cache` in `src/`, the exact header rules and
tracing, nothing in the cached tree reading the request, and `prefetch={false}` on product links.

- **Header sources** are `/:category(<CATEGORY_IDS>)/:slug` and `/:region(us|uk)/:category(<CATEGORY_IDS>)/:slug`,
  never a bare `/:a/:b`, which would CDN-cache `GET /api/reviews`, `/api/alerts` and the other API
  routes. A new category must be added to `CATEGORY_IDS`; the test fails until it is. A bogus slug in a
  real category is a cached 404; other two-segment junk (`/wp-admin/x.php`) is an uncached function 404.
  The rules also need the request to have no `RSC` header (`missing: rsc`): only the HTML document is
  cached, never an RSC payload. Vercel's key already honours Next's `Vary: rsc, …`, so this is a
  backstop against one flight payload being served for a product URL for a day. Client navigations
  lose little by it, since their `_rsc` key changes with the page they start from.
- **These 404s have an empty body without JavaScript.** A `notFound()` in a page rendered on request
  escapes React's server shell, so Next sends its error shell (`<html id="__next_error__">`): status
  404 and the not-found head (title, `noindex`), but the header, "We couldn't find that page" and the
  footer are drawn in the browser from the inlined RSC data. Before, unknown product URLs got the
  prerendered `_not-found` page (about 13 KB of markup). This covers product URLs that drop out of the
  daily data and every unknown two-segment path. Accepted: status and `noindex` are right, so search
  is unaffected, and visitors with JavaScript see the full page. Not a `loading.tsx` or Suspense above
  `notFound()`, which would make these soft 200s, nor a redirect to the category page; a 404 that works
  without JavaScript would need an edge check before the function, which isn't worth an invocation on
  every request.
- **Missing data fails as a 500, never a cached 404.** `catalog.ts` treats a missing catalogue as an
  empty category, so a function bundle without its traced data would 404 every product URL, and the CDN
  would keep those for a day while the build stays green. ProductView throws instead when the region
  has no products at all; Vercel's CDN caches only 200, 404, 410 and redirects, never a 500. (Next's
  own trace of `catalog.ts` already lists the catalogues for every page that imports it, product routes
  included; `outputFileTracingIncludes` adds them to `/admin`, which reads them only through the root
  layout, and makes the product routes independent of that.)
- **`htmlLimitedBots: /./`** makes metadata block, in `<head>`, for every user agent, so the one cached
  copy suits every crawler. With no user agent at all Next streams the metadata into `<body>` anyway,
  so the CDN header is only added when the request has one (`has: user-agent .+`): that render is
  served but never cached.
- **`prefetch={false}`** on every `<Link>` to a product page (cards, deal cards, Amazon picks, compare,
  guides, browse, home, search results, the alert page): a prefetched product link is a function
  invocation each time it scrolls into view, 48 per grid and 200 per browse page. The `<a>` markup is
  unchanged; hub pages differ from before only by `"prefetch":false` in their RSC payload.
- **The offer table now renders on the server.** `PhoneOffers` (`useSearchParams` inside Suspense)
  bailed out to client rendering in the static HTML; product HTML now carries the h1, store rows and
  price check (iPhone 17 Pro: 104 KB → 136 KB). The eBay row's "checked" date formats in the region's
  time zone, so the server (UTC) and the visitor's browser agree, and `shortDate` (price check card and
  texts) takes its "this year" from the catalogue's day, not the clock, so a copy cached over New Year
  hydrates without a mismatch.
- **In-process memo.** The root layout's nav, the Footer's data and `getVsPairs()` are computed once
  per server process (the data only changes with a deploy), and ProductView reads `regionUpdatedAt()`
  instead of `getCatalog(undefined, region)`, which scanned every offer. Warm product renders take about
  14 ms; a cold instance first parses about 53 MB of JSON (0.55 s locally, ~300 MB RSS).
- **Tracing.** `outputFileTracingIncludes` lists the catalogues for the product routes and `/admin`,
  whose root layout read them but traced none; `raw/`, `history/` and `archive/` are excluded
  everywhere. The test matches the keys exactly as `collect-build-traces` does, against
  `normalizeAppPath(entryName)` (`/app/[category]/[slug]`, `/app/admin`; the root is `/app`).
  `scripts/vercel-ignore-build.sh` now also skips pushes that touch only those folders (backfills), and
  judges everything since the last successful deploy (`VERCEL_GIT_PREVIOUS_SHA`, falling back to
  `HEAD^`), so a docs commit on top of a code commit no longer skips the code
  (`tests/vercel-ignore-build.test.ts`); `tests/` and `scripts/` still build, because `next build`
  typechecks them.
- **A product render bug is now a runtime 500, not a failed build.** After any change to ProductView
  or what it renders, crawl every product URL against `next start` and compare heads with the
  prerendered pages. For this change all 28,204 returned 200 with title, meta, canonical, hreflang and
  JSON-LD identical to the prerendered ones, Googlebot and Bingbot got them in `<head>`, and UTC and
  Sydney servers returned byte-identical product HTML.

Check after the first deploy, and again after the next daily data deploy (none can be run locally):

- `curl -sI` one AU, one US and one UK product twice: `x-vercel-cache` MISS then HIT, `age` counting
  up. After the next data deploy the same URLs must be MISS again with `age` reset. Vercel documents
  this (the deployment is part of the cache key); if a copy ever survived a deploy, visitors would get
  yesterday's prices and chunk hashes the new deployment no longer serves: turn on Skew Protection and
  lower `s-maxage`, or purge the CDN from `refresh-prices.yml` after the deploy.
- `curl -sI -H 'RSC: 1'` a product twice, then the same URL without it: the last must be `text/html`.
- Usage → Functions (invocations, Active CPU) and Fast Origin Transfer a week in (COST.md). Confirm the
  plan: on Hobby (1M invocations, 4 h Active CPU, 10 GB Fast Origin Transfer a month) a daily crawl of
  ~24,000 long-tail product URLs is close to the limits. If so, shrink the crawl surface (sitemap tier,
  IndexNow) or the cold start; don't reintroduce ISR.

Rollback: `git revert` the commit; full prerendering returns with no data or URL change.

Follow-ups, none of which moves deploy time: a `data/summary.json` plus per-category lazy loading in
`catalog.ts` to cut the cold-start parse from 53 MB to about 2.5 MB (needs an equality test for
`updatedAt`, region-wide duplicate names and brand order); slimmer `/compare` (19.6 MB HTML), `/saved`
(8.2 MB) and category grid payloads; one region's nav and footer per page, or a lazily loaded nav,
instead of all three (~15 KB a page); trimmed `PhoneOffers` props; `preferredRegion` for Australian
time to first byte on CDN misses; plain `<a>` product links if client-side navigations (whose `_rsc`
key changes with the page they start from, so they mostly miss the CDN) show up as a large share of
invocations.

## 2026-10-26: No prerendered page carries a catalogue; grids send one page, the rest is a static file

Vercel refused the production deploy: "ISR page compare is 20.11 MB, over the 20 MB limit"
(`FALLBACK_BODY_TOO_LARGE`). `/compare` passed every Australian product, whole, to `CompareView`
(19.55 MB of HTML), `/saved` every summary to `SavedList` (8.2 MB), and every category and brand page its
whole list to `PhoneBrowser` (`uk/laptops` 3.6 MB, `us/headphones` 2.3 MB, `brands/hp` 785 KB). The
grids also bailed out to client rendering (`useSearchParams`), so their HTML had no product cards at all.

- **Category and brand grids** (`src/lib/browse.ts`, `PhoneBrowser`): the page sends the first 48
  products in the default order ("Most compared"), the total, and the filter chips with their counts
  (computed on the server over the whole list; they never depend on the active filters). The whole list
  is a static file per region and category, or per brand, with more than 48 products
  (`/api/grid/<region>/<category>`, `/api/grid/brands/<brand>`: `force-static`, `dynamicParams = false`,
  89 files, the largest `uk/laptops` at 1.84 MB, 264 KB gzipped). `PhoneBrowser` loads it on
  `requestIdleCallback` (a timeout in Safari), or at once when someone filters, sorts, searches or presses
  "Show more"; until then a filtered view shows a skeleton and "Loading all N products…", and if the file
  can't be loaded it says so, filters what it has, and offers "Try again". URL filters and deep links
  (`/phones?max=500`, `/brands/hp?cat=laptops`) work as before. The file is trimmed to what the grid
  reads (no slug, offer count or top price, only the category's own filter facets, false flags left out),
  with `category`, `region` and the brand-plus-model `name` sent once (`packGrid`/`unpackGrid`, about a
  quarter smaller). Its URL carries `?v=<GRID_FORMAT>.<import time>.<commit>`, so a browser never mixes a
  cached list with newer data or code; bump `GRID_FORMAT` when the file's shape changes.
- **The first page is in the HTML now.** `PhoneBrowser` wraps the `useSearchParams()` half in Suspense
  with the same grid, unfiltered, as its fallback, so the static HTML carries the toolbar, the filters and
  48 product cards with their links, for crawlers and for the first paint; the browser then renders the
  real thing over it. Layout shift on category and brand pages fell from 0.56–0.62 to 0 (local Chromium),
  and the compressed `/laptops` document from 164 KB to 28.5 KB. Small grids (48 or fewer) have no file.
  `robots.txt` already disallows `/api/`, so crawlers that obey it never fetch the lists; they see the same
  48 cards a visitor's first screen shows.
- **`/compare` and `/saved` pass nothing.** `CompareView` fetches the chosen products from
  `/api/products?p=<path>,<path>` and searches the region's `/search-index.json` (loaded on focus, as the
  header search does) to add one. `SavedList` asks for `&view=summary`, in requests of at most 50 paths and
  6,000 characters (the list holds 100). `/compare/[pair]` pages were already server components with their
  two products. Both also work for US and UK products now: before, a `/us/…` path in the tray or saved list
  matched nothing on these Australian-only pages.
- **`/api/products` is a function, cached like a product page**: `force-dynamic`, `Cache-Control: public,
  max-age=300`, `Vercel-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400`, so each
  distinct query is rendered once per CDN region per deploy. Input is checked strictly
  (`src/lib/product-refs.ts`): each path must match `^(/(us|uk))?/<category id>/[a-z0-9-]+$`, at most 50 and
  6,000 characters; anything else is a 400 with `no-store` and one of four fixed messages, never the input.
  Unknown paths are left out of the answer. The browser sorts and deduplicates the paths so one set is one
  CDN key. It throws (a 500, never cached) if a region it was asked about has no catalogue, like
  ProductView. It traces the catalogues (`outputFileTracingIncludes`), and `tests/routes.test.ts` now
  expects exactly the product routes, `/api/products` and `/admin` to.
- **`/brands`** (674 KB, of which 404 KB was the RSC copy of every card's element tree) draws its cards
  in a small client component, `BrandList`, given one row per brand: identical markup, 394 KB.
- **A filtered deep link never paints the wrong products.** The prerendered fallback is the unfiltered
  first page, so `/phones?max=500` used to show 210 products and $2,000 phones until hydration. The root
  layout's head script (beside the theme one) adds `html.gq` when `location.search` carries a grid key
  (`q`, `brand`, `min`, `max`, `storage`, `fold`, `5g`, `stock`, `multi`, `cat`, `f.*`, or a `sort` other
  than `popular`), and `globals.css` then shows the fallback's skeleton and "Loading products…" in place of
  its cards and count (`[data-grid-fallback]`, `[data-unfiltered]`, `[data-filtered-only]`). Crawlers and
  visitors without JavaScript never get the class, so they still see the 48 cards; a test checks the
  script's keys against every `params.get()` in `PhoneBrowser`. A view that needs the whole list also asks
  for it while rendering rather than after the first commit. With a 4x slower CPU, `/phones?max=500` now goes
  skeleton → "87 products" with layout shift 0.0008.
- **The compare tray keeps one region and one category** (`compareGroup` in `product-refs.ts`: `"us/tvs"`).
  The old guard split the path on "/", so every US or UK product counted as the category "us" or "uk", and
  a US TV could join US headphones once `/compare` rendered US products. `CompareView` also keeps only the
  first product's region and category from a hand-made or old link (its rows, currency and search are that
  product's) and keys columns by path, since a slug can exist in two regions.
- **Smaller fixes from review.** `?sort=` takes only the sorts we offer (`isSort`, own keys only):
  `?sort=valueOf` used a built-in as the comparator and crashed the grid. `/saved` says "Couldn't load N
  saved products. Try again" when one of a big list's requests fails, rather than quietly showing the rest.
  A failed product fetch is retried when its page mounts again; before, it stayed failed for the visit.
- **The build checks its own output** (`scripts/check-prerender-size.mjs`, run by `npm run build` after
  `next build`, and `npm run check:size`): it lists the 15 largest `.html`, `.rsc` and `.body` files in
  `.next/server/app`, warns over 1 MB of HTML or 2 MB of anything else, and fails over 15 MB, a quarter under
  Vercel's limit (Vercel counted `/compare` as 20.11 MB against a 19.55 MB file). A failed build leaves the
  last deploy live, as Vercel's refusal does, but says which file and why. It fails only near the limit,
  not at the warning sizes, because a failed daily build also holds back that day's prices.

Measured locally (`next build`, about 40 s): 846 HTML pages, the largest now `/brands` (394 KB), then
`/uk/deals` and `/deals` (~355 KB); category pages 83–254 KB (median 211 KB), none over 300 KB; nothing
over 600 KB. Before, 17 were over 600 KB and 10 over 1 MB. Total prerendered HTML 139.6 → 102.3 MB.
`/compare` 19.55 MB → 45 KB, `/saved` 8.2 MB → 47 KB, `uk/laptops` 3.6 MB → 223 KB, `brands/hp` 785 KB → 185
KB. Small grids grew (`brands/hyperx` 81 → 181 KB) because their cards are now in the HTML. Every
prerendered page's title, meta tags, canonical, hreflang, JSON-LD and h1 are byte-identical to the
previous build. `tests/client-data.test.ts` pins the endpoint's input rules and answers (run against the
real route with today's data), the list files, the first page matching the default order, and that no
server component passes a loader's product list to a client component except through `gridProps`.

Follow-ups: the search index is the next file to watch, a single prerendered body like these
(`uk/search-index.json` 4.8 MB, AU 3.4 MB) that grows with the catalogue toward the same 20 MB limit (the
build's size check warns about both today); split it per category or trim its entries before uk passes
about 10 MB. Brand pages key on a lower-cased slug while `getBrands()` groups by the raw name, so 20
brands that differ only in case (BlueAnt/Blueant/BLUEANT) share one URL that shows only the largest
variant; group by slug, or normalise brand case at import. The root layout still sends the nav and
footer for all three regions (~15 KB a page); one region's would need region layouts or route groups,
not worth the restructure on its own.

## 2026-10-27: No email per feedback or review

The owner, across the sites: "stop sending me emails for every single feedback … and every single
rating … I can check in the admin dashboard." `/api/feedback` and `/api/reviews` no longer call
`notifyOwner`. Both wait in `/admin`, whose overview counts unresolved feedback and reviews to approve.

## 2026-10-27: Compare Empire family links

The owner, once YGO Compare existed: "our website should all have all of our
compare websites now in the suite of websites … just try to backlink all of
it." Every site's footer now links the other eight: RiftCompare, OP Compare,
DexCompare, MTG Compare, Gundam Compare, Lorcana Compare, YGO Compare
(ygocompare.com), CamCompare (www.camcompare.app) and Compare Empire
(www.compareempire.com, Australian tech prices), each on the host it already
uses (no apex or www change). Plain followed links, never sponsored: they are
our own sites. The link text says what each compares ("Yu-Gi-Oh! card prices",
"Camera and lens prices"), with the site's name after it, rather than the
brand alone. MTG Compare is sealed-only since 2026-10-21, so its anchor now
says "Magic: The Gathering sealed prices" everywhere.

Footer only. In-page blocks ("Compare other TCGs" on card and product pages,
the article blocks) keep to card games, and the two sites that are not card
games are labelled as the wider family, so nine look-alike sites linked from
every page body never read as a link network.

`FAMILY_SITES` in `src/lib/site.ts`, drawn as one row above the footer's
legal line (`tests/family-sites.test.ts`).

## 2026-10-27: The apex is the canonical host again

`www.compareempire.com` has had no DNS record since the 2026-10-26 outage
(checked from GitHub's runners against 8.8.8.8 and 1.1.1.1), while
`compareempire.com` serves every page. Every canonical, sitemap and robots URL
still said www, so Google could crawl none of them. `SITE` is now the apex and
moves a www `NEXT_PUBLIC_SITE_URL` to it; IndexNow and alert emails follow.
The eBay account-deletion endpoint keeps its www default because eBay signs
its challenge with the registered URL; it is overridable with
`EBAY_DELETION_ENDPOINT`. Moving back to www means restoring its DNS, waiting
for Vercel to show both domains Valid, then changing `SITE` and the redirect
together.

## 2026-10-29: Guides carry live store data, and category titles say "price comparison"

Search Console (90 days to 2026-10-28) showed the site barely visible: 43
clicks, while `/us/robot-vacuums` had 7,609 impressions for "robot vacuum
price comparison" at position ~6 and no clicks, and the few guides there were
already earned impressions. Two changes follow.

Category pages are titled "<Category> Price Comparison <Australia|US|UK>" and
their h1 says "price comparison", because that is the phrase people search.

The guides grew from 11 to 52, each aimed at one search intent (best picks,
head-to-head, where to buy, buying guides, shopping smarter) so they don't
split a query between themselves. No guide types a price: every number comes
from the catalogue at build time through shortcodes in `GuideBody`
(`[[top:]]`, `[[stores:]]`, `[[by:]]`, `[[deals:]]`, `[[plans:]]`,
`[[build:]]`, `{{count:}}`, `{{storecount:}}`; pure logic in
`src/lib/guide-data.ts`). Store claims in prose are dated ("when we wrote
this, October 2026"); the "who is cheapest" tables recompute daily. MSY and
Umart share one price list, so they count as one store (`PRICE_TWINS`).
`npx tsx scripts/check-guides.ts` warns when a block would render empty;
`tests/guides.test.ts` pins front matter and internal links. Guides are in the
sitemap through the existing guides section. Re-check Search Console around
2026-11-17.

## 2026-10-30: The blog leads the home page, and an "Our take" shelf for opinion

The owner asked for many more posts, including opinion on the year's big launches (the iPhone Duo, Samsung's
foldables), and for them to be featured on the home page so they are highly indexable. Eight guides were
added, all with live prices through the existing shortcodes. Opinion pieces get their own section, `opinion`
("Our take"), so they don't crowd "Best picks". The home page's guide block moved from near the bottom to
just under the categories: six cards (the newest, with a `featured: true` guide leading its day) and the
next twelve as plain links. Facts about products that are new or not widely reviewed are attributed to the
maker's announcement ("according to Apple's announcement"), and launch RRPs are labelled as RRPs; live store
prices always come from the catalogue.

The phone parser now treats "iPhone Duo" as a foldable (`scripts/build-catalog.ts`), so the Duo joins
foldable filters from the next daily import.

## 2026-10-30: eBay is pinned above the stores on product pages, and links use campaign 5339155911

The eBay Browse job (2026-10-25 entry) was live and finding a new listing for about 1,400 products a
day, but the row sat under every store row, so on a phone with a dozen stores almost nobody saw it. The
owner wants eBay to earn, and the sister sites already pin it first (WargameCompare, 2026-10-28). So on
product pages:

- the eBay listing row now sits ABOVE the store rows, labelled "Ad · New · Shown first". When the job has
  no listing for a product, a labelled "Search eBay" row (new, Buy It Now, in-country, cheapest first) takes
  its place, so every product page has an eBay link above the fold;
- an "eBay $X" (or "Check eBay") button labelled "Ad" sits beside the best price.

The store rows keep their price order, and the cheapest store keeps the "Cheapest" badge and the best price:
eBay is never counted as a store, never the best price and never a deal. The home page gets the same labelled
eBay box the category pages have. Each placement has its own `customid` (`p-<cat>-<slug>-pinned`, `-top`,
`home`) so EPN reports show which one earns.

The daily call budget is now the repository variable `EBAY_DAILY_CALLS` (code default 4,950 while the
current keyset is ours alone); set it to 2500 when the job moves to the owner's new shared keyset (owner,
2026-10-30: 2,500 a day for Compare Empire).

The EPN campaign moves from 5339155912 (CamCompare's) to 5339155911, the family campaign WargameCompare,
FigureCompare and K Young use, so CamCompare's report is its own. Listings already in `ebay.json` carry the
old campaign until the job re-checks them (at most five days); both campaigns pay the same account.

## 2026-10-30: Amazon first, eBay second, the marketplaces box above the stores, in colour

The owner asked for every paid row on a product page at "the very, very top", always shown and bright
rather than black. So the price table now opens with, in this order and on both the "Buy outright" and
"On a plan" tabs:

1. the Amazon row, in every region (Amazon AU carries our tag; US and UK link as before), tinted Amazon
   orange with an orange "Check price on Amazon" button;
2. the eBay row from the entry above, tinted eBay blue;
3. "Also check the marketplaces" (new, refurbished and used eBay searches), in a brand-tinted box with a
   purple heading, where it used to sit in grey under everything.

They keep the store rows' card shape so the table reads as one list, and each is labelled "Ad". The stores
below keep their price order, the "Cheapest" badge and the best price; nothing pinned is counted as a store.

## 2026-10-30: One eBay campaign for every Compare site, hard-coded

**Decided (owner).** Every Compare site now sends eBay clicks to ONE EPN campaign, 5339155912 (RiftCompare's,
already set up), hard-coded in the code: no variable overrides it any more, so a forgotten secret or Vercel
value can't split the sites again. The sites are told apart by the `customid` prefix alone, which comes first
in every tag; this site's is `ce-`. Every Compare Empire customid now starts with `ce-` (`ebayCustomId`), stored listings are re-tagged on load, and the eBay job's reference id is `ce-<region>-<category>`. Reverses the move to 5339155911 earlier the same day.
Replaced: 5339155911 (WargameCompare, FigureCompare, Compare Empire, K Young), 5339231473 (Lorcana),
5339231474 (Gundam), 5339234013 (YGO). Old secrets/variables (`EBAY_AFFILIATE_CAMPAIGN`,
`NEXT_PUBLIC_EBAY_CAMPAIGN_ID`, `EBAY_CAMPAIGN_ID`) are no longer read and can be deleted.

## 2026-10-30: quick view on every product card (from K Young); eBay pinned first, Amazon second

Owner: "I really like the kaeyoung quick view pop ups, can we do that for … all the other sites". A plain click on a
product card now opens K Young's quick view at once with what the card shows (photo, brand, model), then reads the
product from `/api/products` (the compare table's own endpoint, CDN-cached for a day, so no new function) and draws
the product page's own pieces: the storage picker, `PinnedMarketplaces` (compact: no marketplace-search box) and
`OutrightRow` for every store, cheapest in stock first; carrier plans are left to the full page. Clicks on a card's
own buttons (save, compare) never open it. The card is still a real link, so crawlers, new tabs and modified clicks
reach the product page, whose server HTML keeps every price. The two pinned rows swap, on the page too: eBay first,
Amazon second, as on every sister site (owner, 2026-10-30).

## Feedback emailed to the business inbox — 2026-10-30

The owner: "make sure that contact information is really clear on all of our websites so that any feedback feeds
into the respective emails". `/api/feedback` saved rows for `/admin` and emailed nobody. It now emails each saved
message to the site inbox (`notifyInbox`: `INBOX_EMAIL`, else `CONTACT_EMAIL`, compareempire@outlook.com), Reply-To
the visitor when they left an address, at most 25 a day (counted from the table). Reviews and ratings still send
nothing. The footer and `/contact` already show the address.

## 2026-10-31: Home appliances: six new categories

The owner asked to expand past tech into "popular things people are always buying", appliances and the like.
Ranked by Australian search demand, how many stores we can already read, and affiliate reach, six categories
went in first, in three new departments:

- **Vacuums & Cleaning:** stick, handheld, barrel and upright vacuums (`vacuums`; robots stay in `robot-vacuums`).
- **Kitchen:** air fryers and coffee machines.
- **Fridges & Laundry:** fridges and freezers, washing machines and dryers, dishwashers.

Why these: they are the appliances Australians search by model and buy online, the price differences between
stores are large (whitegoods especially, where a few hundred dollars is normal), and every store we already
read for tech sells them. Kettles, toasters, blenders and fans were left out: cheap, bought on impulse, and
mostly no model code to match on. Ovens, cooktops and air conditioners were left out for now: they need
installation, so the shelf price isn't what the buyer pays.

Stores, from a probe run in GitHub Actions on 2026-10-30: The Good Guys, JB Hi-Fi, Betta and Costco list all
six; SharkNinja (Shark vacuums, Ninja air fryers and coffee machines), Tefal (air fryers) and BISSELL
(vacuums) sell direct on Shopify and were added as official stores. Harvey Norman has served GitHub's runners
a bot page since 2026-10-22 (its files for every category are from that day), so it isn't scraped for these.
Not readable: Appliances Online (client-side), Bing Lee, Kmart, Kogan, Retravision, Kitchen Warehouse and
Dyson (403), Big W (times out). Godfreys sells mostly its own brands; the coffee specialists (Di Pacci,
Coffee Machine Warehouse, Alternative Brewing) are mostly commercial machines, used stock and grinder
bundles; both were left out.

Matching: every appliance is matched by the maker's model code (`CODE_FIRST`), which every store prints
(Good Guys in the URL, Betta on the page, Costco and Tefal in the title, the brand stores as the SKU). Colours
have their own codes (Breville BES870BSS and BES870BTR), so each colour is its own product, which is what the
stores price separately anyway. Dyson's part numbers are all digits ("626439-01") and are read where a store
prints them. Accessories, consumables, spare parts, damaged-carton and refurbished stock are refused by the
shared title checks in `scripts/scrapers/appliances.ts`, plus a minimum price per category.

eBay gets a small share of the daily budget for whitegoods (weight 0.3: most eBay fridges are pick-up or
second-hand) and a normal share for vacuums and coffee machines.

## 2026-10-31: wrong-price reports and store suggestions go to a private GitHub repo

**Owner:** "for all of these websites … we must have the ability to report any prices that are wrong, for users to
suggest a store … it's just stored within the GitHub … a daily job that checks for that."

* Every Compare Empire site now has the same two forms: **Report a wrong price** (a quiet link under the price table
  that opens in place, never a pop-up) and **Suggest a store**. Both POST to `/api/report`
  (`src/lib/reports-github.ts`, `src/components/ReportForms.tsx`: the same two files in every site repo).
* They are filed in ONE **private** repository, `Specifxx/compare-reports`: one new JSON file per report at
  `inbox/<site>/<day>/…json`, created through GitHub's contents API with `REPORTS_GITHUB_TOKEN` (a fine-grained token
  with Contents read/write on that repo only, Vercel only). Private because the site repos are public and a note is a
  stranger's free text; the K Young reviews branch is public because reviews are meant to be read.
* Nothing about the visitor is stored: no email field, no IP, no hash of one (the per-visitor limit, 6 an hour, lives
  in the function's memory), and email addresses, IP addresses and phone-like numbers in a note are blanked before
  the write. A honeypot field swallows bots.
* Each write creates a new file (no read, no sha), so reports never race, and the commit subject never carries
  `[deploy]`/`[preview]`. The route is POST only: no page view or crawler runs it, so it costs nothing at rest.
* A daily job in that repo (`triage.yml`) keeps one issue per site listing what is still open, flags repeat
  reports of the same product and store, and warns before the token expires. A handled report is moved to
  `done/<site>/`. Until the token is set the route answers 503 and the form says to email the site's address.
* Compare Empire AU only: `/api/report` also saves each report to the `feedback` table (kind `wrong-price` or
  `store`, no email, no IP hash) and emails the site inbox under the 25-a-day cap, so /admin sees it as before; and
  a `wrong-price` or `store` message sent through the general feedback box is copied to the reports repo as kind
  `other` (without its email or IP hash).

## Visitor reports live on each site's own `reports` branch, not a private repo — 2026-10-31

**Owner:** "we don't need a private repo for this … just build it into each site … inside the public GitHub, it's
fine. As long as it's not reflected on the front end." This replaces the private `Specifxx/compare-reports` repo
of the entry before it; everything else in that entry (the forms, no email/IP, redaction, new file per report,
POST only, 503 until the token is set) still holds.

* Each site writes its reports to **its own repo**, on an orphan branch named `reports` (`SITE_REPOS` in
  `src/lib/reports-github.ts`): `inbox/<site>/<day>/…json`, moved to `done/<site>/…` once handled. The branch is
  never merged into `main` and never deploys: `git.deploymentEnabled.reports = false` in `main`'s `vercel.json`
  (pinned by `tests/reports-github.test.ts`) and the branch's own `vercel.json` turns deploys off as well.
* Nothing on any site reads the branch, so no report ever shows on a page. The branch is public with the source,
  which is why nothing about the visitor is stored and notes are redacted before the write.
* One token, `REPORTS_GITHUB_TOKEN` (fine-grained, Contents read/write on the twelve site repos only), set in each
  Vercel project for Production.
* The daily triage moved to RiftCompare (`Specifxx/TCGEmpire`): `.github/workflows/reports-triage.yml` reads all
  twelve `reports` branches through the API and keeps one issue per site there, plus a once-a-day "Reports digest"
  comment. Those issues are public, so they link to each report's file and never quote a note. It fails (and
  GitHub emails the owner) when a site has no `reports` branch, or the token stops working or expires within 14
  days (checked only when the token is also a TCGEmpire Actions secret). The ops monitor's job list watches it.

## 2026-10-31 — Every product link opens the quick view

Owner, 2026-10-31: "Whenever I click on any item … I want a quick view open like K Young." Only `PhoneCard` carried
`data-qv`, so the home page's lists, deal rows, category tables and other product links went straight to the product
page. `QuickView.tsx` now opens for any plain click on a link whose path `parseHref` accepts (`[/us|/uk]/<category>/<slug>`),
with the link's own photo and text until `/api/products` brings the product's brand, model and photo. A card's own
buttons, links inside the quick view and on the product's own page, and modified, middle and new-tab clicks navigate
as before.

## eBay rows only with stated postage; the phone menu closes on a tap (2026-10-31)

A WargameCompare visitor's feedback (the owner passed it on for every sister site): eBay rows whose postage was overseas
or unknown made "a lot of wasted clicks". Compare Empire's search already asked for local sellers
(`itemLocationCountry`). It now also asks for delivery to the region (`deliveryCountry`) and sends the buyer's country
and a central postcode as `contextualLocation`, so eBay quotes real postage; a listing whose postage eBay does not state
is never kept, and the cheapest delivered (item + postage) wins. Stored rows without postage (317 AU, 279 US, 40 UK on
the day) are hidden (`catalog.ts`) and age out within five days. The phone menu closed on a route change but stayed open
after tapping the page already shown, so every link in it now closes it too.

## Christmas theme: 1 November to Boxing Day (2026-11-01)

Owner, 2026-11-01: every Compare site gets a Christmas theme after the Halloween one, each its own take. Snow behind the home hero, corner trees and gifts, a Santa hat on the logo, and a "Christmas sale check" pill to real price drops only. Pages stay static; the boot script decides whether the markup shows.

The season window is fixed in `src/lib/season.ts`: 1 November to 26 December, every year, by the visitor's own
date, stamped on `<html data-season>` by an inline boot script before first paint. `?season=christmas` previews it out
of season and `?season=off` hides it in season. Every decoration is CSS-gated on that attribute, `aria-hidden`,
`pointer-events: none`, painted under the content (never over a price or a button), animated with `transform`
only, and stopped under `prefers-reduced-motion`. The page's content and links stay in the server HTML; the season
adds no request, no script beyond the boot line and no database or data read. The shared rules sit between
`xmas-common:start` and `xmas-common:end` in `globals.css` (identical on every sister site); this site's colours sit in
the `xmas-site` block after it. Art is eight small SVGs in `public/xmas/`. To end it early, move the `to` date; after
Boxing Day it switches itself off.

## 2026-11-01 — Category titles use the searched word; three US router stores

Search Console (90 days to 29 Oct): "router price comparison" 2,286 impressions at position 8 on `/us/routers` (rising
from nothing to ~330 a day in the last week), one click; "robot vacuum price comparison" ~22,000 impressions at 5–6 on
`/us/robot-vacuums`, no clicks. The router page's title said "Wi-Fi & Networking Price Comparison US" and its description
"Compare 10 wi-fi & networking across 1 US stores".

- Categories carry an optional `searchName` (`SEARCH_NAMES`, `lib/categories.ts`): "Router", "SSD", "RAM",
  "Fridge"… Titles and h1s use it ("Router Price Comparison US: 4 Stores Compared"); menus keep the category's name.
  Descriptions lead with the same words and today's lowest in-stock price.
- US routers had one store (Abt). Added three official Shopify stores, each read through `_shopify.ts`: GL.iNet
  (www.gl-inet.com, USD; only the US/NA plug variant, "CN warehouse" note dropped via the new `clean` option),
  Firewalla (security gateways and access points; no switches, warranties or rack mounts) and AmpliFi (Ubiquiti's
  consumer mesh store). A test build took the page from 10 products to 48. Probed and refused: Cudy (every price is a
  9999 placeholder), Netgear, TP-Link, ASUS, Ubiquiti's main store, eero (not Shopify); Micro Center, B&H, Adorama,
  Newegg and Crutchfield answer 403.
