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

## 2026-11-01: A beta community forum, no accounts, posts in this repo

The owner asked for "user forums ... you don't need to be able to sign in ...
put your name down ... it'll save your name ... all of this is public data ...
keep it within each website's repository", on every site, to give the sites a
reason to come back that search rankings alone don't. `/forum` (docs/forum.md):

- **Storage:** `forum.json` on this repo's public orphan branch `forum`
  (never deployed: its own vercel.json, plus `deploymentEnabled.forum: false`
  here). Written only by `POST /api/forum` with the visitor-reports token;
  a write reads the file's sha and retries when two posts race.
- **Cost:** pages read the file from raw.githubusercontent.com inside their
  normal cache life, never per visit; the browser fetches the newest copy from
  GitHub directly, so a new post shows in minutes with no deploy, no function
  and no database. Rebuilding pages for posts would have meant a build per post.
- **Spam:** honeypot, a 2.5 s minimum on the form, per-visitor limits (4 per
  10 min, 20 a day, 4 threads a day) and a per-instance cap, all in memory; no
  IP, email or hash is stored, and emails/IPs/phone numbers in posts are
  blanked. Links to other sites and slurs or strong profanity are HELD (filed
  under `held/` and flagged in the daily reports triage), never published.
- **Not dead when empty:** the site's topics with a line and a few prompts;
  never an invented post.
- **SEO:** threads are in the server HTML; a thread is noindex until it has a
  reply, the forum page until any thread has one; indexed threads carry
  DiscussionForumPosting JSON-LD.
- **Moderation:** the owner asks Claude; a post is removed by an edit to
  `forum.json` (`removeFromForum` in `src/lib/forum/core.ts`).

## 2026-11-01: eBay quota follows Google search demand

Compare Empire earned its first eBay commission on 1 November, and the owner asked that the daily eBay calls
go first to what people search for and to expensive products, never to anything under $10. About 29,500
products are over the A$10 floor (the floor stays), and the key allows ~4,950 searches a day, so the order
matters. Until now it ranked by stores stocking a product, newness, category and the log of the price.

- **Search demand first.** TCGEmpire's `sister-demand.yml` writes Search Console's page clicks and impressions
  (56 days, no queries) to this repo's `demand` branch every day before the price job; the eBay step fetches
  it. A product's own page (clicks × 20 + impressions), any `/compare/a-vs-b` page naming it (half each), and
  its category's page (much smaller weight) raise its demand. On 1 November 1,000 pages had impressions; the
  US robot vacuum page alone had 22,000.
- **Price counts as its square root**, not its log: commission is a share of the sale, so a A$1,000 product is
  worth about four times a A$60 one, not twice. It stops adding at 4,000, and anything over 15,000 is skipped:
  the first dry run put three US earbuds "priced" 9,999,999.99 (a store placeholder) and a A$160,000 Dell
  server at the top of the queue.
- **The daily tier grew from 25% to 35%** of the budget, so searched products are refreshed every day; the
  rest still rotates stalest first.
- **One budget per eBay quota day (Pacific).** On 1 November a second run the same eBay day hit the rate
  limit after 54 calls. `data/ebay-status.json` now records `quotaDay` and `quotaSpent`; a later run that day
  spends only what is left, or nothing after a 429.
- Without the demand file (branch missing, file older than two weeks) the ranking falls back to the store
  signals, so a broken export costs precision, not prices.

## 2026-11-01: LEGO, matched by set number, and the sitemap moves to tier 2

The owner asked which big retail categories Compare Empire is missing, Walmart- and eBay-style. eBay's largest
categories we don't cover are motor parts, fashion and collectibles (the card sites own those), toys, home and
garden, and health and beauty. A probe from GitHub's runners on 1 November checked which Australian stores we
can read for each:

- **LEGO (added).** Toys R Us, Toyworld, Kidstuff and Hobbyco are on Shopify with full LEGO collections
  (about 1,600 listings). Every box carries a set number and every store prints it (in the SKU, "LEG-42171",
  or the title), so a set is matched by that number and nothing else (`scripts/scrapers/lego.ts`,
  `parseLego` in `src/lib/match-more.ts`): no number, or two, and the listing is left out; keychains, lights,
  display frames, storage, blind-bag boxes and other brands are refused. The URL is the number
  (`/lego/lego-75447`) because stores word names differently. First scrape: 1,066 sets, 695 in two or more
  stores, 466 in three. New sealed LEGO is one of eBay's biggest toy categories, so its eBay weight is 1.4 and
  the eBay search is "LEGO <set number>" with the number required in the listing title. Big W, Target, Myer,
  Mr Toys, Zing, EB Games and lego.com were not readable (403, time-out or no feed).
- **Next, in order:** hair care (Betta's hair dryer, styler and shaver collections; JB's Dyson range), small
  kitchen (microwaves, stand mixers, blenders) and air treatment (purifiers, heaters, fans) at Betta and The Good
  Guys, and BBQs (The Good Guys, 259 listings with Weber model codes). Bunnings, Total Tools, Chemist Warehouse,
  Shaver Shop, Kitchen Warehouse and My Haircare refuse the runners, which rules out tools and pharmacy for now.

`SITEMAP_TIER` now defaults to 2: products at two or more stores (about 4,900 across the three regions),
brand pages, category deal pages and comparisons. A week of tier 1 left over 5,400 pages with Search Console
impressions, so Google is crawling past the sitemap anyway; the sitemap should say which pages matter.
## 2026-11-01 — The visitor's own region by default; the root is the US home

Owner, 2026-11-01: "the default region is the region that the visitor is located in. And if they can't determine it,
then the default should be the US … anywhere that says Australia … needs to change to the US if the US region is
selected … It's probably better for US to be on the indexing. And if anything, no region at all." Australia was the
site root, so an American who typed compareempire.com, or clicked an Australian page in Google, got AUD prices from
JB Hi-Fi with nothing saying there was a US edition.

* **The root is the US home; Australia's home moved to `/au`** (`HOME_PATH`, `lib/region.ts`). `/us` 301s to `/`. Every
  other Australian URL (`/phones`, `/phones/<slug>`, guides, brands) is unchanged, so their rankings are untouched; only
  the AU home moved, and it never earned clicks of its own (43 for the whole site in the 90 days to 28 October).
  The root's title names no country; the AU and UK homes keep theirs.
* **Visitors are moved, crawlers never are.** `REGION_BOOT_SCRIPT` runs inline before first paint: the visitor's region
  is the one they last picked in the header (`ce-region`), else their time zone's (Australia/* → AU, Europe/London → UK),
  else the US. On a page of another region it reads the page's own hreflang alternates and `location.replace`s to that
  region's copy; `<main>` is hidden until then (at most 1.5 s). A user agent that looks like a crawler, a link preview
  or an audit tool (`BOT_UA`) is never moved and never sees anything hidden, so Google indexes each regional page as
  itself, and hreflang (now with `x-default` = the US copy) tells it which to show where. Time zone, not
  `x-vercel-ip-country`: the pages are static, it costs no function call, and the answer is the same for our three
  regions with the US as the fallback. No cookie, no request.
* **Hubs gained hreflang** (deals, a category's deals, browse, a category's A–Z page) so the move works there too.
* **Pages with no copy in the visitor's region** (guides, brands, comparisons: Australian only) stay put and show one
  line, `RegionNotice`: "In the US? This page compares Australian prices (AUD). See US prices · Stay on Australia".
  Never a pop-up.
* **Pages of no region** (about, contact, legal, reviews, forum, saved, alerts: `isNeutralPath`) render for the US on
  the server and their header and footer move to the visitor's region in the browser; their copy no longer says
  "Australian". The layout's default title and description name no country, `<html lang>` is `en`, the Organization
  serves AU, US and GB, and "Made in Australia" shows on Australian pages only.
* US coverage is the weak point this exposes: 8 US phones from one store, no US PC parts or appliances. That is the
  next job, not this entry's.

## 2026-11-01 — More US coverage: Apple iPhones and LG appliances

Bill wants US visitors (see "Default to the visitor's region" above). The US catalogue had 8 phones from one store and no whitegoods. Apple US now adds its iPhones (73 offers: each model page's `"products"` JSON, carrier-locked entries skipped) and LG US adds fridges (79), washers and dryers (77) and dishwashers (41) from the same JSON-LD listings it already reads, with filters, pedestals and parts refused. The sandbox can no longer reach stores, so `.github/workflows/probe-stores.yml` (run by hand) tries scrapers and candidate URLs from GitHub's network and commits nothing. The big US PC-parts and appliance retailers (Best Buy, Newegg, B&H, Micro Center, Home Depot, Lowe's, AJ Madison) are still behind bot protection and stay out (docs/stores/us.md).

## 2026-11-01: eBay and Amazon rows look like the other price rows

The owner: "the ebay and amazon links should blend in and look exactly the same as the other price rows … reflect that
change on the other sites that require it." Paid marketplace rows (eBay, Amazon, and TCGplayer where it is pinned) keep
their place and their "Ad"/paid-link label, but lose their brand tints and brand-coloured buttons: they use the same row
and the same button as a store. They are still never counted as a store and never re-ranked by commission. This
reverses the 2026-10-30 "bright, catchy colour" pinned rows; eBay ad strips and panels outside the price rows keep
their own look.

## 2026-11-01 — 69 more stores through one reader, and eBay covers every product before repeating one

Bill: "we need to do a scan, and we got to aim for a 100+ stores. Across all regions. I can see that the US we have less stores than Australia … Same as the UK." And for eBay: "prioritize the US first … aim for coverage … for some products, maybe the price gets refreshed once a week … we're not just using our eBay code on the same thing every day."

**Stores.** 677 candidate stores were surveyed from GitHub's network (`scripts/probe-auto.ts`, run by *Probe stores* with a `survey` file; the lists are `docs/stores/candidates*.txt`). Most of the big chains are custom-built or behind bot protection and stay out (docs/stores/us.md, uk.md). Of those that serve a public product feed (Shopify's `/products.json` or WooCommerce's Store API) in the region's currency, 69 sell new product in our categories and were added: 41 in the US, 15 in the UK and 13 in Australia (counts with data: US 29 → 70, UK 21 → 36, AU 34 → 47; 153 in all). They include the US's first PC-parts store (Xidax), its first appliance-and-electronics generalist (Beach Camera), espresso specialists (Whole Latte Love, Seattle Coffee Gear), hi-fi and headphone dealers, camera shops and the brand stores; the UK's Appliance City and Gerald Giles (whitegoods), Audio Emotion and Home AV Direct; Australia's Billy Guyatts and Austin Computers.

* **One reader, one line per store** (`scripts/scrapers/auto-shopify.ts`). The store file names only its categories. Every listing still goes through the shared title checks every other store uses (`IS`, `junk`, `badPrice`), plus a per-category `GUARD` for what generic shops sell that electronics shops don't (valve-amp "vacuum tubes", espresso "kits", power stations, IEMs called "monitors", speaker cables, store bundles, `(SOLD)` trade-ins, "BAD BOX" stock, maintenance plans). A listing that fails is left out, never guessed into a category. Categories were chosen per store from the survey's samples, not from what the checks happened to take: the survey showed, for example, that a toy store's "laptops" are toy laptops.
* **A vendor that is the store's own name is no brand** (Pauls TV, Mymemory), nor is a distributor list; brand stores name their brand.
* **Left out on purpose:** dropshippers selling unbranded or furniture lines (Oz Appliances), stores whose survey showed mostly parts or PA gear in our categories (Paul's TV, GPD Store, Advexure), shops whose currency is not the region's (Edifier US and Kanto bill in CAD, Lefant in EUR), and every store that returned 403, a challenge or a timeout (never worked around).

**eBay: coverage first, the US first** (`plan` in `scripts/ebay-prices.ts`). The 35% daily tier is gone. Each run's queue is: every product never priced on eBay, then every product due again (seven days after its last check, three when it has Google impressions), each group the US first, then Australia, then the UK, most in demand first within a region; only spare calls go to the stalest of the rest. Nothing is searched twice before every product over the floor has been searched once. With about 30,700 products over the floor and 4,950 calls a day, a full round takes about six days, so "once a week" holds; a listing is kept until nine days old (it was five, which would have dropped weekly prices before their next check). The new stores' products are never-priced, so they go first, the US's first.

After the first test scrape the reader also refuses store-made bundles in every category ("… Bundle", "w/ …",
"Protection Pack", "2 Pack", "+ 3 Year"), graphics cards in cameras, microphones in headphones, and 100 V, pendant
and wall-hanging speakers. Categories that held fewer than three real products at a store were dropped from it
(Moon Audio and Upscale Audio soundbars, Len Wallis TVs, Home AV Direct speakers).

## 2026-11-01 — Store survey round 2: 43 more stores (US 70→88, UK 36→48, AU 47→60)

A second list of 457 candidates went through the same survey (`docs/stores/candidates3.txt`); 43 stores read cleanly
and passed a test scrape. The samples showed new kinds of wrong product, so the shared guards now also refuse:
furniture "consoles" (media and record storage, recliners), amplifiers, turntables, valve and guitar bodies and
security cameras in cameras, microphones in washing machines, robot vacuums sold with a camera or scale, car vacuums,
drone service plans, cases and lights, and anything sold "repackaged", "reconditioned" or as an international
version. Left out: Leica Store Miami (mostly accessories), Di Bartoli (the store stopped answering mid-read), and
6th Ave's own kits (only its plain cameras and watches are read).

## 2026-11-01 — Store survey round 3: 17 more stores (US 88→92, UK 48→54, AU 60→67)

399 more candidates (`docs/stores/candidates4.txt`) gave 17 clean stores, mostly hi-fi dealers and two big LEGO shops
(Brickville, Toyworld Bendigo). The Audio Tailor and Aussie Hi-Fi are one stock on two domains, so only The Audio
Tailor is read. "Floor stock", "pre-loved" and "ex-floor" now count as not new, and speaker "packages" (a pair plus
an amplifier) are refused. Yield is falling (from 10% to 4%), so later rounds use brand dealer lists and
regional brand stores rather than guessed domains.

## 2026-11-01 — Store survey round 4: 28 more stores (US 92→100, UK 54→67, AU 67→74)

Guessed domains had run dry, so this round's 173 candidates (`docs/stores/candidates5.txt`) came from published lists:
Lelit's UK dealer list, a list of independent UK LEGO shops, La Marzocco Home's Australian roaster partners, and the
regional stores of brands already read. Independent LEGO shops turned out to be the richest UK source (ten shops,
3,100 sets), and roasters that sell home machines the richest Australian one. A lone minifigure ("NJO0366") carries
digits that look like a set number, so the reader now refuses minifigure codes; coffee-machine servicing and
"value"/"power" packs are refused too. The US reaches 100 stores with data.

## 2026-11-01 — Store survey round 5: 17 more stores (UK 67→73, AU 74→85)

161 candidates (`docs/stores/candidates6.txt`) came from more published lists: UK and Australian hi-fi dealer
locators, specialty coffee roasters that sell home machines, independent LEGO shops and Toyworld franchise stores
(toyworld<town>.com.au). Coffee roasters and hi-fi dealers gave most of the clean stores. Clumsy Goat, Rave Coffee and
Lakeland show UK prices without VAT on their feeds, so they are left out: a price a buyer cannot pay is worse than
no price. "+" bundles and loose motors are now refused in vacuums, and Haden is read only for the categories that held
three real products (its dishwashers did not).

## 2026-11-01 — Store survey round 6: 4 more stores (UK 73→75, AU 85→87)

109 candidates (`docs/stores/candidates7.txt`) gave nine readable stores, and four passed: Kiss the Hippo and Horsham
Coffee Roaster (UK coffee machines), Sydney Hi-Fi Mona Vale and Klapp AV (AU speakers, soundbars, headphones). Left
out: Workshop Coffee (every machine is sold with its own coffee subscription, a store bundle), Willow (one brand's
own appliances, which no other store sells), Audio Concept (custom-size soundbars), and roasters with one machine.
The two AU hi-fi shops skip in-wall and in-ceiling speakers, single left or right earbuds, isolators, "packages"
and speakers sold "(each)", which would compare one speaker with another store's pair.

## 2026-11-01 — Store survey rounds 7–10: 22 more stores (UK 75→89, AU 87→95)

Four more lists (`docs/stores/candidates8.txt` to `candidates11.txt`, 731 candidates) gave 22 stores that passed a
test scrape: UK hi-fi dealers (Holburn, HiFi Lounge, Hi-Fi Stereo), coffee roasters that sell machines, Fenwick,
Zatu Games and Appliance Superstore, brand stores (COSORI, Levoit, Audeze UK; KitchenAid and Tefal AU) and Australian
hi-fi shops. Mirrors are read once: Bentalls is Fenwick's own stock, The Coffee Collective's products are The Espresso
Shop's, Townsville Hi-Fi is Gold Coast Hi-Fi's, and Shark (sharkclean.com.au), Dreame and Narwal AU were already read
under other ids. The candidate check now also skips every site in the retailer registries. Left out: Workshop
Coffee-style machine + subscription bundles, a drone shop selling training courses, an espresso parts shop, a radio
shop, a games shop whose "speakers" were Magic cards, and Appliance Superstore's vacuum drawers, hobs and hoods.

## 2026-11-01 — Store survey rounds 11–14: UK and AU pass 100 stores (UK 89→103, AU 95→101)

Guessed domains had stopped working (round 11: 228 candidates, 2 stores). Rounds 12–14 found shops instead by
searching for popular products ("Sonos Era 300 buy UK", "LEGO 10316 Rivendell", "Dyson V15 Detect") and surveying
whoever sold them (`docs/stores/candidates13.txt` to `candidates15.txt`). This turned up the largest new stores of
the whole survey: Atlantic Electrics, RDO, London Appliances and Stuart Westmoreland (UK appliances), BiRite (AU
appliances) and AJ Toys, Toys N Tuck, Brick-a-Brac, Sam Turner and The Playroom (LEGO). 20 stores were added: UK +14
(Doug Brady Hi-Fi, AJ Toys, Atlantic Electrics, AOL Cookshop, RDO, Stuart Westmoreland, London Appliances, Toys N Tuck,
Balance Coffee, Brick-a-Brac, Potters Cookshop, Start Fitness, Sam Turner, Let's Run) and AU +6 (The Audio Room,
Custom Home Theatre, BiRite, Videoguys, The Playroom, BuyMobile). "Box opened" and ex-display stock is refused at the
appliance stores.

Left out: shops that show prices without VAT (Audio Gold, Total Cards, the trade CCTV and catering suppliers WME and
Canmac), resellers with marketplace-style listings (Gadcet, ScreenMoove), and The Appliance Guys AU, whose prices
include delivery, installation and removal. Next time, search for products first: it found more real stores in 60
candidates than guessing did in 700.

## 2026-11-02 — Black Friday page

`/black-friday`, `/us/black-friday` and `/uk/black-friday` show the region's deals (`DealsView`) under a Black Friday
heading with the year's dates, at one URL kept every year so links and rankings carry over. Black Friday is the biggest
tech-buying search of the year and the page has to be indexed weeks before the day (27 November 2026), so it ships now.
Sitemap tier 1 with the other hubs; footer links in every region. Never a "was" price we can't back up, a countdown,
"ends soon" or an invented sale. Dates are pure (`src/lib/black-friday.ts`, tested). Part of the passive-growth plan
(owner, 2026-11-02: no daily Reddit posts).

## 2026-11-02 — Free price widgets

`/embed` lists two free things a reviewer, blogger or forum can keep: a live price badge (`/embed/price?p=<product
address>`, an iframe plus one plain text link to the product page, the part search engines credit) and a plain-HTML
category link with no iframe. The daily outreach offers these instead of asking for a link (passive-growth plan, owner
2026-11-02). The badge is a route handler with no dynamic segment (the address is the `p` query), so the "every
[segment] is prerendered" rule doesn't apply and it renders on request like a product page: it traces the catalogues,
sets its own day-long `Vercel-CDN-Cache-Control` and `frame-ancestors *` (only this response can be framed; nothing in
`next.config.mjs` changed except the trace), and is noindex. A region with no data throws instead of caching a 404.
`/embed` is a neutral page (header follows the visitor's region) built with the deploy.

## 2026-11-02 — Self-updating price report

`/price-report` is one neutral page, kept at one URL and built with each deploy from that day's catalogue: per region,
stores and products priced, how often the cheapest store is 10%+ under the dearest for the same model and size, and
that share per category. It leads with the 10% share, not the median gap, because many products sell at one list
price everywhere (the US median is 0%), and the share is the honest "does comparing pay" number. It is the citable
asset the daily outreach offers tech writers (passive-growth plan, owner 2026-11-02). Pure numbers in
`src/lib/price-report.ts` (tested): in-stock outright prices only, one gap per product from the variant most stores sell.

## 2026-11-02 — Seasonal sale pages

`/boxing-day`, `/january-sales` and `/lunar-new-year`, with `/uk/…` and `/us/…` (owner-approved growth plan,
2026-11-02): one URL per region, kept every year like `/black-friday`, built weeks ahead so they are indexed
before the day. Each is the region's deals page under the event's heading (`DealsView` with `sale`). The intro
states where the day is a sale day as a fact, never as the page's region. Dates, the year a page is about (it
rolls over a week after the event) and the intro are pure in `src/lib/sale-seasons.ts`
(`tests/sale-seasons.test.ts`); Lunar New Year is a published-date table to 2040 (6 February 2027). Footer and
sitemap. Never a "was" price, a countdown or an invented sale.

## 2026-11-02 — Four new categories: small kitchen, coffee gear, hair tools, BBQs

From the approved consolidation plan (owner, 2026-11-02): Compare Empire is the general store for broad categories,
so hair care, small kitchen, BBQs and coffee gear come here as categories, in every region, rather than as new sites.

- **What each holds.** Small Kitchen Appliances: stand and hand mixers, blenders, food processors, kettles, toasters,
  microwaves, juicers, benchtop cookers and contact grills. Coffee Grinders & Gear: burr grinders, pour-over kettles,
  scales, manual brewers (AeroPress, V60, Chemex, plungers, moka pots) and milk frothers. Hair Dryers & Stylers:
  dryers, straighteners, curlers, hot brushes and stylers (Airwrap, FlexStyle) and hair clippers. BBQs & Pizza Ovens:
  gas, charcoal, pellet and kamado BBQs, smokers, griddles and outdoor pizza ovens. Two new departments, "Hair &
  Beauty" and "BBQs & Outdoor"; the kitchen two join "Kitchen".
- **They are appliance categories** (`scripts/scrapers/appliances.ts`): new-only, parts refused, model code first.
  Accessory nouns are tested only on the part of a title before "with" / "incl." / "+", so "Supersonic Hair Dryer
  with Diffuser" is a dryer and "Diffuser for Supersonic" is not. Each category refuses the others' look-alikes:
  a gooseneck kettle is coffee gear, never a kettle; a kitchen brand's "grill" is a benchtop grill unless the title
  says gas, charcoal, pellet or outdoor; a bag of coffee whose grind option names a brewer is not a brewer.
  Manual brewers (AeroPress, Chemex, drippers) left Coffee Machines for Coffee Gear.
- **Brands without renames.** The new brands (Weber, Wilfa, Moccamaster, ghd…) live in their own table, read only
  for the four categories: added to the shared one they renamed, and so re-URLed, existing coffee-machine and
  air-fryer products. Every existing catalogue was rebuilt before and after and compared: no slug changed.
- **Small kitchen keeps its type nouns** in the product key: a range's kettle and toaster share every other word.
- **JB Hi-Fi** is read for hair tools and grinders only: its kettles, toasters and blenders run to a thousand-odd
  product pages inside the 40-minute budget the older categories share.
- **Stores** come from re-surveying every store already read (one catalogue read gives every category, so this costs
  no extra requests), the earlier candidates with kitchen, coffee, hair or BBQ names, and 139 shops found by
  searching for popular products (`docs/stores/candidates16-*.txt` to `candidates18.txt`).
  The survey's samples drove a second round of refusals: built-in ovens and range cookers "with grill", espresso
  machines' drip grills, cookware grill pans (Le Creuset, Staub, Lodge…), coffee sold "ground for" a brewer, gift
  and tasting packs, trade-ins, ex-display stock, and any part named for the product it fits ("Gas Burner for
  Ooni Karu"). Left out: Salons Direct (trade prices ex VAT), The Espresso Shop .com (mirror of .co.uk), Espresso
  Underground (parts), Electricals Online (sensor lights), Coffee Compass (beans only).
- **First count** (test scrape, 2026-11-02, stores with 3+ offers): AU bbqs 12, coffee gear 35, hair 8, small
  kitchen 11 (plus JB Hi-Fi, The Good Guys and Betta); UK 14 / 36 / 6 / 18; US 12 / 17 / 8 / 16. Hair tools and
  BBQs are the thin ones; the next survey should target salon suppliers that show VAT-inclusive prices and BBQ
  specialists.

## 2026-11-02 — Share buttons and shared saved lists

Word of mouth (owner, 2026-11-02). The product page's Share button now names the real gap (cheapest and dearest
in-stock outright price from two different stores, one currency) and the quick view has one too: the phone's share
sheet, else copy the link, no pop-up, no reward (`src/components/ShareButton.tsx`). The saved list can be shared:
`/saved?l=/phones/a,/us/tvs/b` carries up to 50 product paths in the link, nothing is stored, the shared view is
read-only with "Keep this list", and each item says its cheapest store (`bestStore`, added by `/api/products` only, so
no page grows). `/saved` stays noindex and out of robots. Every shared link carries `utm_source=share&utm_medium=<product|list>`
(`src/lib/share-link.ts`, tested); the button sends a Vercel `share` event and `ShareArrival` one `share_visit` per
tab, which RiftCompare's weekly growth report counts. No new function and no per-product share image.

## Sites that grow each other: the family feed, cluster blocks and short footers (2026-11-02)

Owner, 2026-11-02: "We need each site to help each other grow as a team effort", and the
footer family lists were "a bit convoluted … I'm wondering if it actually helps". Plan:
"Sites that grow each other" in the consolidation doc (https://claude.ai/artifact/QjrWGrfBqH4sKctwdjwptK).

- **Three clusters** (`src/lib/family-network.ts`, the same file in every repo): card games
  (Rift, OP, Dex, MTG, Gundam, Lorcana, YGO, Cyberpunk), hobby (Wargame, Figure, Gunpla on
  Gundam Compare) and tech (Compare Empire, CamCompare). KaeYoung stays out.
- **The family feed.** Each site's own daily data job writes `family-feed.json` (its best real
  deals and pre-orders today, per region) beside the data it already commits, and copies its
  cluster sisters' feeds from raw.githubusercontent.com into `family-cluster.json`. Pages read
  the committed file: no database of another site, no request-time fetch, no new function. A
  feed older than four days, from the wrong site, with a link off its own host or a saving that
  isn't the arithmetic of its two prices is dropped (`validFeed`), so a block shows less, never a guess.
- **One block per page**, on the deals, Black Friday and pre-order pages: one tile per sister with
  its best item in the visitor's region, else the US price in its own currency. Labels never name
  a country. Plain followed links inside a cluster.
- **Footers: one short line.** The sites of our own cluster by name, then one "A Compare Empire
  site" link to https://compareempire.com/network, which lists every site. Why: nothing counts
  footer clicks, footer links get few, and Google gives little weight to sitewide links between
  one owner's look-alike sites (12 sites all cross-linked in every footer is the pattern it can
  read as a link scheme). Cross-traffic should come from the price blocks, which people have a
  reason to click.
- **Here:** `/network` is the network page; the deals and Black Friday pages (all categories) show
  CamCompare's three best camera deals for the region; a camera's page links the same model on
  CamCompare when `sameProduct` finds exactly one (a kit, a combo or two candidates is no link);
  and our feed lists every camera page so CamCompare links back. The cluster file is traced into
  the product function (`next.config.mjs` RUNTIME_DATA).

## 2026-11-02 — Amazon Associates: following the Operating Agreement's Dos and Don'ts

The owner sent Amazon's own "Operating Agreement: Top Dos and Don'ts" page (2026-11-02: "make sure you
are following these instructions for all amazon affiliates"), and every site was audited against it.
The rules we keep, on every Compare Empire site:

- **Disclosure beside every Amazon link** ("Ad" / "Paid link"), and Amazon's statement "As an Amazon
  Associate I (we) earn from qualifying purchases." in the footer of every page.
- **Amazon's trademark notice** in the footer of every page: "Amazon and the Amazon logo are trademarks
  of Amazon.com, Inc. or its affiliates." No Amazon logo, screenshot, review or Amazon's own colours
  (its orange): the page "Don't use style or color of Amazon site which may cause confusion".
- **Links lead to a specific product** (an ASIN, or a search for that exact product's name), never a
  category or generic search: "All the links or buttons on your site should take customers to specific
  products on Amazon."
- **No Amazon link in a pop-up or layer**: the quick views show none; product pages carry the row.
- **Never Amazon prices in price tracking or alerts** ("Don't track prices or set price alerts"), and no
  Amazon link or trademark in any email, SMS or printed material.
- Every link tagged, rel="sponsored nofollow"; no incentive (cashback, discount) for buying through it.
- Here: no Amazon link in the search box or palette (free text, in an overlay) or the quick view; the
  Amazon row lost its orange dot and orange hover; the footer carries the trademark line.

## 2026-11-02 — The country chooser in the home hero, with drawn flags

Owner: "the region switcher must be more prevalent on all sites, on the main home page hero etc … and have
the flags as well". Every country's home (`HomeView`) has a "Prices for" row of flag chips above its search
(`HomeRegionPicker`): plain links to each live country's home, the current one marked with its currency,
and each click remembered (`rememberRegion`) so `region-boot` does not move the visitor back to their time
zone's home. The header switcher stays.

- **Flags are inline SVG (`src/components/Flag.tsx`), not the `REGIONS[].flag` emoji and not image files.**
  Windows draws a flag emoji as two letters ("AU"); image files would be new requests and hosting. The
  header switcher, its menu, the region notice, the stores page and the price report draw it too. The same
  file is in every Compare Empire repo that has a region switcher; keep the copies identical.

## 2026-11-02: Nobody is moved to another region on a guess

Since 2026-11-01 a visitor on another region's page was moved in the browser to their time zone's copy (`REGION_BOOT_SCRIPT`).
Crawlers were excluded, but Search Console then reported `/us/routers` as "Duplicate, Google chose different canonical"
(`/routers`), and Google's own guidance is not to redirect automatically on a guessed location. Now only a visitor who
PICKED a region (header switcher or the notice's buttons, kept in localStorage) is moved; everyone else stays on the URL
they opened and `RegionNotice` offers "Switch to <region> prices", linking the page's own hreflang alternate (their
region's home when the page has none). The owner's 2026-11-01 rule still holds: the visitor's region is the default
everywhere it is chosen without a URL (neutral pages, the switcher), and the root stays the US home.

## 2026-11-02 — At most one production build every 12 hours, and no branch but production deploys

**Why.** The owner capped Vercel spend at $5–6 a day across every site. 1 November cost $11.82 (normally
$2–4), and Build CPU was the largest line ($4.26), followed by CDN requests and ISR writes, which every
build multiplies (a deploy empties the page cache, so the next crawl re-renders and re-writes every page).
The `[deploy]` gate itself held; its premise did not: sessions landed 7–14 `[deploy]` commits a day per site
(manual "release now" runs and `[deploy]` in merge subjects), RiftCompare, OP, MTG and DexCompare alike.
Compare Empire's site built on every push to its production branch (84 commits that day) and CamCompare on
every three-hourly price commit, because neither had the gate.

**What.**
- `scripts/vercel-ignore-build.sh` skips a production `[deploy]` commit when the last production
  deployment (`VERCEL_GIT_PREVIOUS_SHA`, set by Vercel in that step) is under 12 hours old; the commit
  rides the next release. `[urgent]` in the SUBJECT overrides it, and only when the owner says a release
  cannot wait. An unset or unreadable last deployment builds (fail open). `tests/deploy-gap.test.ts` pins it,
  and the file is the same in every Compare Empire repo.
- `vercel.json` `git.deploymentEnabled` starts with `"**": false` and enables only the production branch
  (Vercel: when a branch matches several rules, any `true` wins). No preview is built for any branch or pull
  request, `[preview]` included; the older per-branch `false` entries stay for orphan commits' own copies.
- So "push to prod" means land on the production branch; the release reaches visitors within a day.

## 2026-11-02 — No link prefetching, no crawling of query URLs, a lighter search index

**Why.** This project was the team's most expensive this cycle ($11.08: Fast Origin Transfer 50 GB, Fluid CPU
16 h, 1.95M CDN requests, 3.1M ISR reads, 24 h of build CPU). Builds are now capped (entry above). The rest is
pages rendered or read from storage instead of served from the CDN:
- 74 of 93 `next/link`s prefetched. A category or deals page put dozens of product links in view, and each
  prefetch is an RSC request, which `next.config.mjs` deliberately never CDN-caches, so every one was a full
  server render of a product page (~150 KB), or an ISR read for a static page.
- Crawlers walked `?v=`/`?utm_` variants of product pages. Each query string is its own CDN entry, so each was a
  fresh render, and every deploy (up to 8 a day until today) emptied all of them.
- The search index was every product in a region with its image URL: 8.4 MB (1.5 MB gzipped) in the UK, fetched
  whole by each visitor who opens search.

**What.** Every `<Link>` carries `prefetch={false}` (`tests/cost-rules.test.ts`). `robots.ts` disallows `/*?` with
allows for `/_next/`, `/og` (share images) and icons, plus RiftCompare's scraper list. The search index keeps
thumbnails for the 2,500 most popular products only (`SEARCH_IMAGE_LIMIT`), cutting it by about a third. Google
still reads every page: sitemap URLs carry no query and canonicals are clean.

## 2026-11-03 — Footers link only card sites to card sites; every other site lists no sisters

The owner asked whether linking every Compare Empire site together helps or is a risk for search and for how the
sites look. Verdict: a sitewide footer link between sites one person owns carries little ranking value (Google
discounts it), and a mesh of unrelated sites (camera, appliance and figure sites in a card site's footer) can read
as a link network and looks odd to a reader. The owner said do it.

- `footerSisters()` in `lib/family-network.ts` (same file in every repo) now returns the other card sites for a card
  site and nothing for any other site. Gundam's Gunpla side no longer pulls WargameCompare and FigureCompare into its
  footer; the engine footer's heading is "Other card games".
- WargameCompare, FigureCompare, CamCompare and Compare Empire show no sister list in their footers, only one
  "A Compare Empire site" link to compareempire.com/network (Compare Empire: its own /network), the one page that
  lists every site. KaeYoung still links none.
- Anchors stay the brand name only, and links stay plain followed links: they are honest links between sites with
  one owner, not paid, so no `sponsored`/`nofollow`.
- Kept: the "Other card games" / hobby / tech price blocks on deals, Black Friday and pre-order pages
  (`clusterSisters`). They sit on a few pages, show real prices a reader of that page may want, and are not sitewide.
## 2026-11-03 — A share card that says "price comparison" at thumbnail size

**Why.** Owner: the link preview should be "more visual", so that "even from far distance, people can tell what
this website's going to be about". The old card was a text headline on a pale background ("Is that sale actually
real?"), which at feed-thumbnail size read as nothing in particular.

**What.** One template (`src/app/og/route.tsx`) for the home pages, categories and products: the brand's violet,
a two-to-three-word headline in Archivo Black ("Compare prices.", "Cameras", the product name), and a white panel
of one real product's store prices: the three cheapest in-stock outright stores and the dearest, the cheapest in
green with a tick, and "Save $X vs the dearest store" when the gap is at least 3%. Home and category cards add a
row of three product photos under the headline. `src/lib/share-rows.ts` picks the rows (never eBay, plans or
out-of-stock offers; each store once) and the lead product (most stores, a 4–35% gap: wider is usually a list price
against a sale and reads as a trick; two stores as a fallback). A page with no rows of its own (deals, sale seasons)
draws grey bars, never invented stores or prices.

**Cost.** No new function: it is the same edge route, cached a day by the CDN, and the page that links it is the
only thing that reads the catalogue. The card's URL carries its prices, so it changes when they do. Fonts are
subset to Latin (60 KB). Store photos are fetched by the route and dropped unless PNG/JPEG under 3 MB within 2.5 s,
so a slow or WebP photo blanks one tile instead of failing the card.

## 2026-11-03 — The quick view shows the product's own link

**Why.** Owner: "quickview popup should have a link change as well for all sites, instead of using the same link". The
pop-up kept the list page's URL, so a copied or bookmarked link lost the product, and Back left the page instead of
closing the pop-up.

**What.** Opening a quick view pushes the product page's own existing URL (the product's own path, plus `?v=<variant>` once a size or colour is picked, as the share button already did) with `history.pushState`
(`src/lib/quick-view-url.ts`, the same file on every site). Back closes it and restores the list's URL, Forward reopens it,
closing it (×, Escape, the backdrop) steps back, so the history never fills with pop-ups. "See price history and details"
only hides the pop-up and navigates to the URL already shown, which Next turns into a replace: Back from the product page
goes to the list. The entry copies Next's own history state (`__NA` and the router tree), so the app router passes the
push through and the page under the pop-up never re-renders.

**SEO.** No new URL exists: the link is the canonical product page, which a reload, a share or a crawler gets in full
server HTML. Never a `?view=` or `#` variant (duplicate URLs, extra CDN copies). Pinned by `tests/quick-view-url.test.ts`.

## 2026-11-03 SEO audit: home titles, alt text, WebSite entity, brand breadcrumbs

Bill's network SEO audit read the AU home title as 76 characters ("Compare Empire Australia — compare tech prices across
131 Australian stores"), cut off in results, and 45 of 87 homepage photos without alt text. Home titles are now keyword
first, brand last, all within 60: "Tech Price Comparison: Phones, Laptops, TVs | Compare Empire" (the root, still naming no
country) and "Compare Tech Prices in Australia / the UK | Compare Empire". Every product photo (search, palette, guide
cards, category tiles, Amazon picks, gallery thumbs, brand list, compare picker, guide tables, embed) carries the product
name. The layout's JSON-LD adds a WebSite beside the Organization, and brand pages show a breadcrumb with a BreadcrumbList.
Already in place: Product + AggregateOffer and breadcrumbs on product pages, breadcrumbs + FAQPage on categories,
reciprocal hreflang with the US root as x-default, price history on every product page, and no automatic geo-redirect
(only a visitor who picked a region is moved; crawlers never; 2026-11-02). `tests/seo-audit.test.ts`.

## 2026-11-03: Amazon AU prices from the Creators API, switched on by its keys

The owner's Amazon Associates AU account was approved; he asked for Amazon price rows "using the API". Amazon's
only product API is now the Creators API (PA-API 5 was retired in 2026). It opens only to accounts with
qualifying sales (third-party guides say 10 in the last 30 days), is closed again after 30 days without one,
and starts at 1 request a second and 8,640 a day. So the code ships now and does nothing until
`AMAZON_CREATORS_AU_CLIENT_ID` / `_CLIENT_SECRET` (and `_VERSION`, 3.3 by default) exist, in GitHub secrets
for the ASIN finder and in Vercel for the build. Without them, or while Amazon refuses, every product page
keeps today's "Check price on Amazon" row.

- **ASINs are found in GitHub Actions, prices by the build.** `scripts/amazon-asins.ts` (daily refresh,
  `AMAZON_SEARCH_BUDGET` 400 searches) keeps a result only when `lib/listing-parse.ts` (the parser the
  catalogue itself uses, moved out of `build-catalog.ts`) reads its title as the product's own group key and
  variant; misses are retried after 30 days. ASINs may be stored, so `data/amazon/asins-au.json` is
  committed; `status-au.json` says what the last run did (off, refused, ok). `scripts/fetch-amazon-prices.ts`
  runs before `next build` (`AMAZON_BUILD_CALLS` 100 getItems calls, ten ASINs each, about two minutes),
  most-compared products first, and writes the git-ignored `data/amazon-live/au.json`: Amazon's licence lets
  a price be kept 24 hours and shown with its time, and a commit would keep it forever. It never fails a build.
- **Where it shows.** Only the product page's Amazon row (`PinnedMarketplaces`): the variant's own `/dp/`
  link once its ASIN is known (placement `product-asin`), and the new, in-stock, AUD buy-box price with
  "as of <time> Sydney time" and Amazon's disclaimer under the marketplace box. The page drops a price over
  24 hours old (`isFreshAmazonPrice`), and the browser checks again because the CDN keeps pages for hours.
  A price outside 60%–160% of the variant's store median is dropped. Never in a sort, the "Cheapest" badge,
  deals, alerts, history, feeds, metadata, JSON-LD, the quick view or another region
  (`tests/amazon-api.test.ts` pins the reader to `ProductView`). The row stays an ad, outside the store order.

## Site reviews move to RiftCompare's shared queue (2026-11-03)

The owner wanted RiftCompare's rating pop-up on every site, each site's reviews public, and every written review approved in
RiftCompare's admin (riftcompare.com/admin/reviews); star ratings count at once. From now on the "Write a review" tab of the
feedback widget and the new corner card (`components/site-reviews/RateCard.tsx`, after 4 pages and 3 minutes or on return from
a store tab, at most three times 14 days apart, always closable) send to `https://riftcompare.com/api/site-reviews`, and nothing
new is written to the `reviews` table. The reviews already there stay where they are and keep showing: `ReviewsSection` merges
this site's approved reviews (`/api/reviews`) with the shared service's (`/api/site-reviews/compareempire`, CDN six hours), and
the score counts both. Reviews still pending in this site's own admin are finished there. "Send feedback" is unchanged. While no
ad script is on the page the card says "We don't run banner ads, so if this helped, please leave us a review."

## 2026-11-03: "Hot right now": the year's big launches lead the homepage

Owner, 2026-11-03: "there are extremely hype products right now like the iphone duo and the galaxy fold 8 so we
should make sure we feature these as much as possible on the website home". Launch weeks are when buyers search,
and the catalogue already carries these phones in every region; the homepage didn't say so.

- **A hand-kept launch list, facts from the maker.** `src/content/launches.ts` holds each launch's name, pre-order
  and release dates, the last day it is featured, and the maker's own announcement as its source, with the day it
  was checked. No price is ever typed there. Today: iPhone Duo (pre-order 16 October, out 23 October 2026, Apple
  Newsroom) and Galaxy Z Fold8, Fold8 Ultra and Flip8 (on sale 7 August 2026, Samsung Newsroom).
- **Prices are the region's own stores'.** `lib/launches.ts` matches each launch to the catalogue by name; the
  listing with the most stores wins (then the cheapest), so a UK store that splits colours into their own products
  still finds the main one, and a pattern must not match a sibling (`Fold8` never takes the `Fold8 Ultra` row).
  A released launch no store in the region lists is left out; one still on pre-order shows "No store price yet".
- **Placement.** `components/HotLaunches.tsx`, straight under the hero on `/`, `/au` and `/uk`, newest release
  first. The day is the last import's (`catalogDay`), not the build clock, so the row changes only with data.
  Static and server-rendered like the rest of the page: no request-time read, no new build.
- Adding a launch is one entry; it drops off the homepage after `featureUntil`. The launch calendar (`/launches`,
  `/uk/launches`, `/us/launches`, `views/LaunchesView.tsx`, in the sitemap, linked from the row) lists every entry,
  coming soon then newest out, with its pre-order and release dates, the source link and the region's store price.
## 2026-11-03: A Creators page and a homepage bubble, like RiftCompare's

Owner: "having the creators page for all of these sites as well is really, really good. Like just a bubble and then a
really nice formatted creators page, just like how RiftCompare does it." Word of mouth from creators and visitors is the
sites' main growth channel, so every site gets one.

`/creators` is RiftCompare's page in Compare Empire's theme, without the parts that need a database: the list is the
static array in `src/lib/creators.ts` (empty until the first creator agrees; the grid shows "Your channel here" spots,
never an invented creator), applying is a pre-filled email to `CONTACT_EMAIL`, and there are no creator codes. "Buy them
a coffee" is the creator's own Ko-fi, Patreon or tip page: the site never handles the money. `CreatorsCornerBadge` is the
bubble in the homepage hero (top-right from sm, a centred pill above the headline on a phone); the footer and the sitemap
link the page. Prerendered like /about: no data or request read, no ISR. Not called "partners" anywhere: that word means
the affiliate links.

## 2026-11-04: The big chains: Officeworks read directly, the walled ones through their affiliate feeds

Owner: "We are missing some stores in compareempire. Especially Australian favourites like officeworks. We need all of
the big websites on it … all big stores captured with no gaps." The audit (`docs/stores/big-stores.md`) found that
nearly every national chain in all three regions walls off server-side reads (Akamai, Cloudflare, PerimeterX), and the
survey rules forbid going past a wall or using a key lifted from a page's JavaScript (Target's redsky, Costco's
GraphQL, Myer's Constructor, Officeworks' Algolia).

- **Officeworks is read through its own public, keyless catalogue API** (`/catalogue-app/api/products?sku=…` and
  `/prices/<sku>`, the calls its product page makes), with the product sitemap as the SKU list. The prices endpoint
  is the price the page shows; the `edlpPrice` attribute is the fallback and the "was" price. Only products still
  `rangedOnline` are kept. About 200 product calls and one small price call per kept product, spaced out.
- **Every other walled chain gets a feed-gated store file** (`scripts/scrapers/feed.ts`, `feedStore({...})`): it
  reads the chain's affiliate-network product feed once the `FEED_URL_<CHAIN>` GitHub secret exists and exports
  nothing until then. The feed is the chain's own daily export of every product, price, stock and tracked link, so
  it is both the legitimate door and the one that pays. Prices in another currency, non-new condition and
  untracked links are refused by the reader, as a store's listings would be.
- **A chain with no listings is not a store yet.** `/how-we-pick-stores` and `llms.txt` now count and list only
  `activeRetailers` (stores with listings), so the 35 gated chains don't appear as stores the site compares until
  their feed is live. Nothing indexable changed for the stores that already have listings.
- Crampton & Moore (UK, Magento, server-rendered) and Peter's of Kensington, Harris Scarfe and Everyday Home Living
  (AU) are read directly; Appliance Central and Reliant answered the probe but gave the import a 403, and were dropped
  rather than worked around; Appliances Online is a next-round candidate.
- Kmart, Bunnings, Costco (all regions) and Micro Center run no affiliate programme we know of and block servers,
  so they stay out until that changes; their secret names are reserved in case a feed appears.
- Added the same day (owner: "this is also just for Australia we need to cover us and UK as well"): Best Buy's free
  Products API (`regions/us/bestbuy.ts`, `BESTBUY_API_KEY`: keyword searches per category through the feed rules, the
  Impact feed merged on top), and feed-gated files for Office Depot, Williams Sonoma, Kohl's, Macy's, Wayfair, BJ's
  (US) and Robert Dyas, Littlewoods, The Entertainer, Hamleys, Ryman, Jessops, Marks Electrical, Appliances Direct
  (UK). The owner's prompt is now ordered US, UK, then AU.

## 2026-11-04 — List your store: stores come to us

The owner stopped cold email outreach ("not really doing anything") and set the aim: be popular enough that stores
ask us, and encourage the ones that do. Every Compare Empire site now has `/list-your-store` (shared
`ListYourStore.tsx` + the `ListStore` form in `ReportForms.tsx`), linked from the footer, `/contact` and the stores
page: what a store gets (free, no contract, never pays to rank), what we need (a readable shop, own currency,
established), and what happens next (checked within a few days, reply through the store's own contact details).
The request is filed as a `suggest-store` report with `issue: "owner"`; RiftCompare's daily reports triage puts
those first and asks for a reply within two days. No email is asked for (the reports branch is public); no pop-up,
no cold email. RiftCompare and OP Compare keep their `/stores/suggest` page (now the owner pitch) and redirect
`/list-your-store` to it.

## 2026-11-05 — Wrong-price reports: a store's own market price, and nothing older than three days

Two visitor reports (`reports` branch) pointed at two importer faults, not two rows:

- **Shopify prices in the caller's currency.** Alternative Brewing and Barista Warehouse showed the Barista Express at
  "$497–$501" while both stores charge $699: Shopify Markets prices `/products.json` for the requester's country, and
  the runner is in the US, so a Markets-enabled store answered in converted US dollars (0.715x that day; the
  `country=US` read of the same feed reproduces it). Every Shopify read now carries the region's `country=`
  (`AU`, `GB`, `US`), as RiftCompare's and DexCompare's importers already do. `probe-auto.ts` never caught it because
  `/meta.json` reports the shop's base currency, which is right; the price was the wrong one.
- **No price older than three days.** The Edge 60 Pro showed Harvey Norman at $697 (the store: $1,199) because
  Harvey Norman had answered a challenge page instead of `__NEXT_DATA__` since 22 Oct, and "a failing store keeps
  yesterday's file" had served a two-week-old file as today's. `build-catalog.ts` now leaves out any raw file older
  than `MAX_RAW_AGE_DAYS` (3): a store that stays broken disappears from the site instead of showing a stale price.
  Harvey Norman and Mobileciti (403 since the same day) are bot walls, so their scrapers are removed rather than
  worked around; their retailer entries stay for history. JB Hi-Fi's product reads get 60 minutes instead of 40
  (half its categories were a week or more old under the 40-minute budget).

## 2026-11-05 — Store pre-orders find themselves

The owner asked for the sites to update themselves for new releases and pre-orders. `content/launches.ts` (2026-11-03)
is the hand-kept half: the hype launches, each dated from the maker. The automatic half is now the stores' own
listings: a listing is a pre-order when the store's availability says so (JB Hi-Fi's `PreOrder` tag, a feed's
availability `preorder`, both carried as `RawOffer.preorder`) or its title does ("(Pre-Order)", "PREORDER
November", "Coming Soon"; `lib/preorders.ts` `PREORDER_TITLE`, read at catalogue build for every source). `Offer.preorder`
and `PhoneSummary.preorderStores` carry it to the pages: the product row says "Pre-order" instead of "Out of stock /
pre-order", `/launches` gets "On pre-order at <region> stores now" (every such product, most stores first, up to 24),
and the home's "Hot right now" row fills its four cards with store pre-orders after the hand-kept launches
(`lib/launches.ts` `storePreorders`, which skips a product a hand launch already shows). Nothing is inferred: no ship
date is parsed from a title, the price is the store's pre-order price, and a product leaves the list the morning every
store simply has it in stock. The first import after this lands marks today's eleven pre-order titles (coffee gear, a
B&O headphone) and JB Hi-Fi's tagged pre-orders; a launch no store lists yet still needs its `launches.ts` entry.
`tests/preorders.test.ts`.

## 2026-11-05 — Thin pages out of the index: a 5,900-URL sitemap with real dates

Search Console for compareempire.com (the owner's analysis, 2026-11-05): impressions peaked near 30K a day on 26–27
October and were near zero by the 29th, with a 0.2% click rate; no manual action, nothing broken, the sitemap
submitted on 3 November with 2,619 of its ~13,500 URLs found. The reading: a new site that offered thousands of
templated one- and two-store product pages at once, which Google sampled and then throttled. Four changes, all of
which alter titles, metadata and the sitemap on purpose (the owner's "redesigns change no URL or title" rule, 2026-11-03,
is for design work; this is the search work it protects):

1. **One-store and sold-out product pages are `noindex, follow`** (`lib/indexing.ts` `productIndexable`: two or
   more stores and at least one in-stock outright offer). They stay live and linked, so a store that lists the product
   tomorrow brings the page back. A brand page whose every product is thin is noindex the same way. The sitemap
   (`lib/seo.ts`) now lists only products at three or more stores, in stock (`productInSitemap`, `SITEMAP_MIN_STORES`
   in Vercel widens it to 2 once Search Console shows this tier indexed), brands with an indexable product, and the
   head-to-heads: about 5,900 URLs (AU 2,997 products, UK 1,783, US 246, 368 brands) instead of 13,500. The old
   `SITEMAP_TIER` is gone.
2. **`lastmod` is each page's real last change.** Every URL used to carry the build time, which teaches Google to
   ignore the field. A product's is the last day any variant's best price moved (`productLastmod`, from
   `series.json`), else the day it was first seen; a category's and a brand's the newest of their products'; a
   head-to-head's the newer of its two; a guide's its date; a sale or deals page the import time; a static page
   (about, privacy…) none. The index dates each child sitemap by its newest entry.
3. **Store titles are decoded before they name a brand or mint a slug** (`scripts/lib/http.ts` `cleanTitle`, run on
   every raw title in `build-catalog.ts`): "Bowers &amp; Wilkins" had become the brand "Bowers &Amp; Wilkins" and
   the slug `bowers-amp-wilkins-…` on four speaker pages, "Weber&#174" (no semicolon) the brand on 17 US grills, and
   a feed's "[v::tx]" tag part of names. The next import merges them under the clean brand; the old product URLs
   301 to the clean slug when it exists (`cleanedSlug` in the product page's loader; a real "amp", as in "WiiM Amp",
   never redirects because the clean slug does not exist), and `/brands/bowers-amp-wilkins` redirects in
   `next.config.mjs`.
4. **The pages earning impressions get a title that answers the click and copy no two pages share.** Product titles
   are now "<name> price in <place>: <price> at <store>, <n> stores compared" (longest rung that fits 70 characters;
   `productTitle`), the description names the store; the About card gains a store-by-store sentence (cheapest, the
   next four, the gap to the dearest); and AU product pages link their category's guides and the brand page.

Not done, on purpose: no indexing requests, no sitemap resubmission (the index is read daily as it is). Recheck
Search Console around 25 November: the indexed count against the 5,900 URLs, and the click rate on iPad, Pixel,
router and Black Friday pages. `tests/indexing.test.ts`.
The owner asked for this release the same morning ("deploy now"), so it shipped as an `[deploy] [urgent]` commit
rather than waiting for the evening data release.

## 2026-11-05: Amazon API prices in every region, not only Australia

The US Associates account (riftcompare-20) was approved today, and the owner asked for Amazon's API prices as price
rows on every site. On this site the machinery from 2026-11-03 was Australia-only (`amazonFor` returned nothing
elsewhere, the scripts read `au` alone). Now `scripts/amazon-asins.ts` and `scripts/fetch-amazon-prices.ts` run for
every region with a tag (AU, US, UK), one file per region (`data/amazon/asins-<region>.json`,
`status-<region>.json`, the git-ignored `data/amazon-live/<region>.json`), and the product page shows the price in
the region's own clock. ONE credential: a Creators API credential is global, and access is per marketplace (it opens
when that store's own account has qualifying sales, about 10 in 30 days), so the AU-named variables
(`AMAZON_CREATORS_AU_*`) serve the US and UK too; `AMAZON_CREATORS_US_*` / `_UK_*` override them only if Amazon
ever issues a separate one. A store that refuses (403) is skipped and the next region still runs, so each
marketplace switches itself on the day its account qualifies. Everything else from the 2026-11-03 entry stands:
prices never committed, shown under 24 hours only, product page row only, never a sort, badge, deal or alert.

## 2026-11-05 — www is a 308 to the apex

The owner asked why compareempire.com gets under 100 impressions a week when it had 50K: "probably the www change".
Checked live tonight: `www.compareempire.com` resolves again and serves every page with a 200 and a canonical that
points at the apex, with no redirect. So the sequence was: www lost its DNS on 26 Oct, the site moved its canonical
host to the apex on the 27th (above), Google's index (mostly www URLs then) could reach nothing for days, impressions
fell from the 29th, and once www came back it was a second copy of the site rather than a redirect. The canonical tag
alone consolidates slowly. `next.config.mjs` now answers every www request with a 308 to the same path on the apex,
except `/api/ebay/account-deletion`, which eBay has registered under the www URL and challenges there
(`tests/routes.test.ts`). This rides the next release with the thin-pages work above; recovery is measured in weeks,
so the Search Console recheck stays at ~25 November.

## 2026-11-06 — Storage, bundles and configurations never share a page; the country and currency sit beside every price

The owner (2026-11-06): keep the country and currency beside the search results, since the UK and US editions leave
prices unconverted; test search with exact model numbers; make sure storage sizes or bundles are never treated as one
product. An audit of every region's catalogue (`scratchpad audit`: variants with two offers that disagree on a
capacity, a size, a bundle word or a price ratio over 1.8) found 2,468 doubtful variants, 119 of them with two
storage sizes in one price row.

What changed in the matcher (`src/lib/match.ts`, `match-more.ts`, `normalize.ts`; every rule has a real title in
`tests/`), always in the direction of keeping listings apart:

- Laptops, desktops and tablets carry a configuration signature as their discriminator (CPU, GPU, RAM, SSD, screen;
  tablets RAM and "2nd Gen"/"2nd Edition"); two listings that state different values never share a page, two that
  state the same or nothing may.
- A title with "bundle" is refused in phones, laptops, tablets and desktops: its price would sit in the phone's row.
- Samsung's "Galaxy A17 4G" is its own phone (sold beside the A17 5G at another price); "Enterprise Edition" is its own
  SKU, not a colour. Other brands' "4G" stays a network note.
- A colour written before the storage ("Apple iPhone 17 Black 6.3" 256GB") is a colour, not a phone per colour, when a
  number or model suffix is left; the UK had five iPhone 17 pages.
- A unit figure ("10.4L", "9 Cup", "4K", "3-in-1") is never a model code; a CPU-like code ("i5-13400F") never is either.
- RAM kits are keyed on the line words plus the signature (capacity × sticks, speed, CL), never the retailer's title
  alone; headphones split earbuds from headphones; BBQ lines keep their fuel (natural gas versus LPG) apart; a Ryzen
  PRO is not the Ryzen.
- The colour slot ("- Natural Gas", "(64GB, Arctic White)", "- Wireless Gaming Headset Black") now puts figures and
  product words back into the identity and keeps only the colour words. The DISPLAY name still follows the old cut
  (a slot of up to four words with a colour word), so a wider split never renames a page.

URLs: the three regions were rebuilt from the same raw listings with the old and the new parser and every slug
compared. Pages whose number-suffixed slug changed (`String(usedSlugs.size)`, unstable by design) and one-store pages
(noindex since 2026-11-05) are left alone; the five indexable pages that moved (Galaxy A16 → A16 4G, the Bose
SoundLink Flex page that held both generations → the 2nd Gen, HyperX Cloud III and the Tefal FW2018 pages that gained a
store and took the shorter name) redirect in `next.config.mjs`. Titles and metadata are untouched.

The UI: `RegionTag` (flag, "Australian stores · prices in AUD", or the tax note) heads the search dropdown, the
palette, the results count on the grid and the quick view's price list; every price in those places carries its ISO
code ("$1,299 AUD"), since AUD and USD both print as "$". `money()` is unchanged, so metadata and JSON-LD are too.

Search (`src/lib/search.ts`): a query word with digits is exact in its digits ("QN90F" no longer lists the QN900F,
"5070" never the 50700, no typo tolerance), and a capacity in the query ("iPhone 17 Pro 256GB") is optional when the
name has none, since storage is a variant, not a page.

Known and left for later: the same headphones are still several pages when stores word the name differently (three
WH-1000XM5 pages in Australia); merging those needs a code or a curated alias and must not be guessed. Model codes
such as SM-S947B are not searchable, since the index holds names only.
## 2026-11-06 — The US and UK must reach 10x and 5x Australia's stores and listings

**Decision (owner):** Compare Empire is not "ready" in a region until the US lists about ten times as many stores and listings as
Australia and the UK about five times; the same rule applies to KaeYoung and the other compare sites. Until then, every round adds
stores: research ranks the popular stores of each category, scam and dropship stores are filtered out, and candidates go through
*Probe stores* before any is added. Round 21 added 106 US and 77 UK stores (`docs/stores/us.md`, `uk.md`).

**Why the listing target needs the chains' feeds:** an independent Shopify store brings 20–3,000 listings; one chain feed
(Walmart, Best Buy, Currys, AO, Argos) brings tens of thousands. The feed readers exist (`docs/stores/big-stores.md`); the
approvals on Impact, Awin and Commission Factory are the owner's step, and the ratio reports say so each time.

**Rule kept:** a store added by the one-line reader gets only the categories of its own trade. The shared title checks are
written for electronics chains and mis-file a cycle shop's "headset" as headphones and a barber's trimmer as a camera, so a
category outside the store's range is never enabled on a count alone.


## 2026-11-06 — Model codes are searchable, and one model code means one page

The two gaps the morning's entry left. First, search: the catalogue now keeps each product's model codes
(`Phone.codes`, every code the stores' titles and MPNs name, most common first, at most six: "SM-S947B", "WH-1000XM5",
"BES870BSS"), the search index carries them and `search()` matches them like the name's own words without counting
them as length, so "SM-S947B" finds the Galaxy S26+ and "galaxy s26" still ranks the plain S26 first.

Second, duplicates. Pages of one brand that EVERY listing on both sides names by the same model code are one product
(`sharedCodeMerges`, `src/lib/match.ts`): the code must be each listing's longest and six characters or more, so a
series name never joins pages ("iQ300" sat on three different Siemens fridges, "X-T50" on the body and its lens kits,
"LGA1700" on every motherboard for that socket, which the first pass merged). A stated spec that disagrees keeps pages
apart (headphones now state their wiring and impedance: the DT 770 PRO is three products, 32, 80 and 250 ohm), a screen
size must match, and the rule runs only where a maker's code names one product: TVs, monitors, headphones, speakers,
soundbars, smartwatches, printers and the appliances. Not cameras (a lens code is the kit's longest), computer parts,
laptops and desktops, drones, phones, tablets or LEGO. Never a fuzzy name: two WH-1000XM5 pages worded differently join;
a page without the code in one of its listings does not.

A sibling page split by a stated spec takes the spec's words its slug lacks as its suffix ("…-headphones-80") instead of
the counter, which changed with the catalogue's size. Rebuilt all three regions with the previous and the new parser on
the same raw listings: 40 pages with two or more stores move, all of them duplicates joining their twin, and each
redirects in `next.config.mjs`. Over the first pass's 213 moves (series codes), the tightening is the whole difference.

## 2026-11-06 — Awin: an accepted store pays from the next morning, on every site, with no step by hand

**Decision (owner: "check if we are making the most of Awin, and if it's not there, just do it"):** the Awin publisher
account (Compare Empire, 3144410) is read every day by `scripts/awin-sync.ts` in its own job, *Awin programmes*
(`awin-sync.yml`, 17:40 UTC or on demand, secret `AWIN_API_TOKEN`, commit without `[deploy]`), which writes
the programmes that accepted us, with their tracked domains, to `data/awin/programmes.json`. Every link to a store's own
page goes through `storeLink` (`src/lib/store-links.ts`): when its host is a joined advertiser's domain it becomes an Awin
deep link (`awinmid`, `awinaffid=3144410`, `clickref=ce-<placement>`, `ued=<the same page>`), rel "sponsored", marked
"Paid link". Order and prices never change.

**Why one public file:** before this, an Awin approval earned nothing until someone pasted a template per store per site
(only CamCompare even had the slot). The file holds only what every Awin link already shows (advertiser id, name,
domains), so the sister sites copy it at build (`scripts/fetch-awin.ts` in each) and one token serves the family.

**Rules:** a programme that refuses deep links is left out (its clicks would land on its home page); eBay, Amazon and
TCGplayer hosts are never wrapped; the sync is never fatal and keeps yesterday's list on any error. A product feed's
`aw_deep_link` now always wins over `merchant_deep_link`, whatever the column order (`headerMap` ranks by alias, not by
column), so a feed row can never lose its tracking.

## 2026-11-06 — Canada and Singapore

Owner: expand Compare Empire to Canada and Singapore, with every affiliate working and as many stores as possible.
`/ca` and `/sg` are regions like `/us` and `/uk` (CAD before sales tax; SGD with GST), each 404 until it has products,
and the header switcher, sitemap, hreflang and the region boot script name a region only once it is live (the layout's
`data-regions`), so nobody is ever sent to an empty region.

- **eBay.** Canada is eBay.ca on the one EPN campaign (rotation 706-53473-19255-0). EPN has no Singapore programme, so
  Singapore's eBay links go to ebay.com on the US rotation, worded "that ship to Singapore", never "from Singapore
  sellers"; the price pass searches EBAY_SG and rewrites the item link the same way.
- **Amazon.** amazon.ca with `compareempire-20` (Creators API 3.1, North America). amazon.sg has no Associates programme:
  no Amazon row in Singapore.
- **Shopify Markets.** Every auto-read store is now asked for its own region's prices (`country=` from the retailer
  id's prefix). Before this, US and UK stores were read with `country=AU`; a store with Markets turned on could have
  answered in another currency's converted price. The currency check still refuses any mismatch.
- **Sitemap.** A prefixed region's category is listed only when it has at least one product strong enough for the
  sitemap, so a new region's thin categories are never submitted (the 2026-11-05 thin-pages rule).
- **Stores.** `docs/stores/canada-singapore.md`: 21 Canadian and 17 Singapore stores read directly, own-trade
  categories only, and feed slots for the big chains, which open when the owner's network approvals land.

## 2026-11-06 — IndexNow sends only the sitemap tier

**Decision (owner: "Compare Empire is still taking a lot of cost … find a way to reduce the cost"):** `scripts/indexnow.ts`
submits the hub pages plus only those changed products that are in the sitemap (`productInSitemap`: 3+ stores, in stock),
not every product whose best price moved. Today's data: 9,734 URLs a day becomes 1,135.

**Why:** IndexNow shares each URL with Bing, Yandex, Seznam and Naver, and they fetch it within minutes of the submission,
which runs five minutes after the daily `[deploy]` commit, when Vercel's CDN has just been emptied. Every submitted product
was therefore a server render (and its share card a second one), ~9,700 a day per engine, and most of them were one-store
pages that ask not to be indexed (2026-11-05, "Thin pages out of the index"), so the crawl bought nothing. Pages outside
the tier are still found through the sitemap's hubs, the grids and `/browse` at the engines' own pace. Widening the sitemap
tier (`SITEMAP_MIN_STORES`) widens IndexNow with it.
## 2026-11-06 — The US is the default region, and one set of posts serves every region

**Owner (Bill, 2026-11-06):** "I want the US to be the default region … unless we can tell that you're from Australia and
we bring you to Australia" and "make region agnostic blog posts … aim for around 10 … get rid of all the region specific
ones", because the site was only getting Australian visitors.

**Region:** `REGION_BOOT_SCRIPT` now moves every visitor (never a crawler) to their region's copy of a page, when the page
lists one as an hreflang alternate: their pick, else their time zone's region (AU, UK, CA, SG when live), else the US.
This reverses the 2026-11-02 rule that moved only visitors who had picked. URLs, canonicals and hreflang are unchanged;
crawlers are still never moved, so every regional page stays indexable.

**Posts:** the 73 Australian guides are gone; 11 posts written for every country replace them (TVs, noise-cancelling
headphones, soundbars, Bluetooth speakers, espresso machines, grinders, gaming monitors, grills and pizza ovens,
beginner cameras, Black Friday 2026, the sales calendar). `GuideBody` draws each live block and inline price once per
live region (`.rg-<region>` / `.rgi-<region>`); the boot script sets `html[data-gr]` and CSS shows the reader's, the US
when unset (what crawlers read). A region whose stores share too few listings for a ranked table gets single-store rows
("1 store"), and a block with nothing in a region says so in one line. Posts never type a price or a `max=`/`min=`
(one currency), and their slugs and titles name no country (`tests/guides.test.ts`). `/guides` is now a page of no region.

**Redirects:** every retired guide 301s (`content/guide-redirects.json`, read by `next.config.mjs`) to the new post on
its topic, else its category's page (the US one where the US has 20+ products in it), else `/guides`. Never let a
retired guide 404, and never reuse a retired slug.
## 2026-11-06 — Awin: one datafeed key reads every joined chain's feed

Bill asked for at least 20 stores on the most popular products in the US and UK. Today's catalogue has none: the best
US phone has 1 store, the best UK phone 3, and outside LEGO no UK product passes 9. In the US and UK those products are
sold by national chains that wall off every server read, so their affiliate feeds are the only door; the plan is in
Bill's doc "Compare Empire: US and UK plan to 20 stores". A survey of 60 US and UK power tool shops found 4 readable
(Coastal Tool, Toolnut, Factory Authorized Outlet, Axminster), so a Power tools category waits on the same feeds and
is not built yet.

Until now every feed-gated chain needed its own `FEED_URL_*` secret, pasted by hand after each approval (20+ for the UK
alone). Awin serves all of a publisher's joined feeds under ONE datafeed key, with a public feed list
(`productdata.awin.com/datafeed/list/apikey/<key>`). So `feedStore` now falls back, when its own secret is missing and
`AWIN_DATAFEED_KEY` exists, to the store's site in `data/awin/programmes.json` (the daily joined list): a joined
advertiser's largest active feed is read with our columns (brand, EAN, MPN, stock, currency). An Awin approval now
switches a chain on the next morning with no step by hand. A `FEED_URL_*` secret still wins; an advertiser not joined
is never read; rows go through the same title, currency and condition checks as every feed.
## 2026-11-06 — Every comparable US and UK product in the sitemap

**Owner (Bill, 2026-11-06), from an outside SEO review:** "Include every US product with 2+ stores in the sitemap, and
noindex the single-store pages", "put each region on its own URL with correct hreflang and canonical tags", and cut the
templated boilerplate that makes 18K product pages look like scaled content.

**Checked live first (2026-11-06, page source of `/`, `/au`, `/uk`, `/us/tvs`, `/uk/tvs`, `/us/headphones`):** every
region already has its own URL with a self-canonical and reciprocal hreflang (`/` is the US home, `/us` 301s to it on
purpose, x-default is the US copy). Nothing to change there. One-store pages were already noindex,follow (2026-11-05).

**Sitemap:** the US, UK, Canada and Singapore now list every indexable product (two or more stores, in stock); Australia
keeps the three-store tier (`SITEMAP_MIN_STORES` still widens it). Today's data: US 245 → 967, UK 1,671 → 3,265, AU
unchanged at 2,668. The US catalogue is 18,322 products but 17,297 of them are sold by one store, so the US sitemap
cannot grow further until stores overlap more (the store-growth thread and the chain feeds). IndexNow keeps the
three-store tier everywhere (`productInIndexNow`): its burst of renders right after a deploy is the cost the 2026-11-06
IndexNow entry cut, and the sitemap is read at Google's own pace instead.

**Unique content per product:** the "About" card now says where the price sits in its category in that region ("costs
less than 64% of the 428 in-stock products in our TVs category in the US … the middle price is $1,297.99") and, from a
week of history up, how the best price moved over about 30 days (`src/lib/product-facts.ts`). "for this phone" on every
category's page now names the model. Guides link from product pages in every region (posts are region-agnostic since
the entry above); the brand chip stays Australian, where brand pages live.

## 2026-11-06 — Specs that compare: one reading per title, and curated phone sheets

Owner: the compare table was missing processors on laptops and screen, chip, camera and battery on most phones; a US
review found monitors labelled wrong (the LG 27GM950B, a 5K Mini LED IPS, shown "4K · OLED"; the 32QN600, QHD, shown
"4K").

- **Why they were wrong.** Specs were read from every store title joined into one string, so any one title decided a
  row; and "27-Inch" counted as a model code, the shortest one, so different LG 27" and 32" monitors became one
  product. Now each title gives its own reading and the most common one wins (`lib/specs.ts` `vote`), titles that
  carry the product's own model code are preferred (`ownTitles`), and a size is never a code (`NOISE_CODE`).
- **Processors.** `cpuName` reads every spelling stores use (U7-265HX, Ultra 9 386H, RAI 9 HX 370, Ryzen AI MAX+ 395,
  Snapdragon X2 Elite, i7-14650HX) into one name, for laptops, desktops (new Processor and Graphics rows) and tablets.
- **Curated sheets.** `data/specs/<category>.json` holds figures from the maker's sheet as the model's Wikipedia
  infobox gives it, with the URL beside each; they beat a title's figure. 107 phone models so far. A figure we could not
  confirm is left out, never guessed: "—" is better than a wrong number. GSMArena (Tollbit 402) and PhoneArena
  (Cloudflare) refuse automated reads and are not worked around.
- **Rows.** The compare table shows each category's rows in one order (`SPEC_ROWS`), then any other spec.
- **Shipping a reading fix without an import.** `scripts/refresh-specs.ts` rewrites only `specs` in every
  catalog.json; the daily build does the same from the raw files. Phones keep a build-time figure their stored titles
  no longer state (the catalogue trims titles and blurbs).

## 2026-11-06 — US prices: each Amazon country needs its own credential; brand stores read directly

**Owner (Bill, 2026-11-06):** the US "literally only has like one store … where's the Amazon? … Best Buy might not
actually work, but we can probably find a proxy … get that immediately on this website."

**Amazon.** The AU Creators API credential answered every US and UK call with `400 InvalidAssociate` ("Your credential is
not linked to the partner tag"): a credential belongs to the Associates account that made it, so the 2026-11-05 note
that one credential is global was wrong. The import now stops a region at the first such answer and records "refused"
with the reason, and passes `AMAZON_CREATORS_US_*` / `_UK_*` / `_CA_*`. The US credential is made in the US Associates
Central (store riftcompare-20, version 3.1); prices still wait until that account has 10 qualifying sales in 30 days.

**Best Buy.** No proxy: a store that walls off servers is never worked around (the rule on every site). Best Buy's free
Products API (`BESTBUY_API_KEY`, wired 2026-11-04) is the legitimate door and waits only for the key.

**Brand stores read directly.** Samsung US (listing JSON-LD), Google Store US (Pixel, the config page's offers: unlocked
only, one offer per model and storage at its lowest colour price) and Motorola US (product-page JSON-LD; a page that
sells several storages for one price is skipped). Carrier, trade-in, monthly-only and renewed prices are refused.
Phone dealers read through `autoShopify` keep only US unlocked units (global models, dual-SIM imports and carrier
phones refused). Rounds 22 and 23 added 25 independent US stores this way.
## 2026-11-06 — Awin offers and vouchers for the whole family (`data/awin/promotions.json`)

**Decision (owner: store promotions "captured in our price comparison"):** the daily Awin sync also reads Awin's Offers
API (`POST /publisher/3144410/promotions`, membership `joined`, status `active`) and publishes the live offers and
vouchers of the programmes that accepted us in the public `data/awin/promotions.json`, beside `programmes.json`. Only
what an advertiser gives its publishers to share: title, description (240 characters), start and end, regions, and a
voucher's code. An offer with no end date, already over, from a programme we have not joined, or a voucher whose code
Awin withholds, is dropped (`toPromotion`, `tests/awin.test.ts`). A failure keeps yesterday's file and never touches the
programme list. Sister sites copy it in their build and show an offer as a note beside that store's row, never in its
price or its rank, and drop it at its end date (KaeYoung first, `src/lib/promos.ts` there).
