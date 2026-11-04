# The big chains: who is in, who is walled off, and what unlocks each (2026-11-04)

Owner, 2026-11-04: "We are missing some stores in compareempire. Especially Australian favourites like officeworks. We
need all of the big websites on it … ensure all big stores are captured with no gaps." This is the audit, done from
GitHub's network (`.github/workflows/probe-stores.yml`; the sandbox can't reach any store), with the way in for each
chain. The survey rules still hold: never past a bot wall (a 403, challenge page or captcha ends it), never an API key
lifted from a page's JavaScript, never a page of Amazon's or eBay's (their APIs already feed every region).

## How a walled chain still gets in: its affiliate-network product feed

Most of the chains below block every server-side request (Akamai, Cloudflare, PerimeterX) but publish a daily product
feed through their affiliate network: every product with its price, stock, link and image, as a CSV or Google Shopping
XML behind a URL tied to the publisher account. That is the one legitimate, stable door, and it pays for every click.

`scripts/scrapers/feed.ts` reads such a feed (CSV, TSV, pipe or XML, gzip or not, 2,000 rows at a time, any column
naming the networks use) through the same title checks every store goes through (`classify`: condition, currency,
category). A chain's store file is one line naming its secret, e.g. `FEED_URL_UK_CURRYS`. **Until the secret exists the
file exports nothing, the chain has no listings, and `activeRetailers` keeps it off the "How we pick stores" page and
`llms.txt`** (a store is listed only once it has prices). When the owner's application is approved:

1. In the network, find the feed URL (Commission Factory: *Tools → Product Feeds*; Awin: *Toolbox → Create-a-Feed*,
   pick the advertiser and CSV; Impact: *Content → Catalogs*, download/export URL; CJ: *Links → Product Catalogs*).
2. Add it as a GitHub Actions secret on `Specifxx/compareempiretake2` with the name in the table (the workflow already
   passes every one of these names to the import; see `.github/workflows/refresh-prices.yml`).
3. The next three-hourly import picks it up; the chain's rows appear with the next release.

Direct links keep earning only if the feed's links carry the tracking parameters (they do: networks build feed
links as their own redirect URLs). If a feed turns out to be ex-GST/VAT or in another currency the reader refuses it,
and the chain simply stays off until a correct feed is set.

## Australia

| Chain | Status | Why | Way in | Secret |
|---|---|---|---|---|
| **Officeworks** | **Live** (`categories/officeworks.ts`) | Category pages are Algolia (client-side), but the site's own keyless catalogue API answers `/catalogue-app/api/products?sku=…` and `/prices/<sku>`; the product sitemap lists every SKU | Read directly, every import | — (feed `FEED_URL_OFFICEWORKS` also works, as a fallback) |
| JB Hi-Fi, Harvey Norman, The Good Guys, Betta, Bing Lee's rivals… | Live already | | | |
| **Peter's of Kensington** | **Live** | Server-rendered ItemList JSON-LD | direct | — |
| Appliance Central | Dropped | category pages answered 200 to the probe but 403 to the import run: a wall, not worked around | feed if it has one | — |
| **Everyday Home Living** | **Live** | Shopify | direct | — |
| **Harris Scarfe** | **Live** (`categories/harrisscarfe.ts`) | SAP Commerce cards with the product JSON inline; the public price, never the "Friends" club price | direct | — |
| Big W | Walled (403 / challenge) | Akamai | Commission Factory feed | `FEED_URL_BIGW` |
| Kogan | Walled | Cloudflare challenge | Commission Factory feed | `FEED_URL_KOGAN` |
| Catch | Walled | Akamai | Commission Factory feed | `FEED_URL_CATCH` |
| Bing Lee | Walled | Cloudflare | Commission Factory feed | `FEED_URL_BINGLEE` |
| Myer | Client-rendered (Constructor.io key in page JS; robots disallows `/electrical/`) | not read by policy | Commission Factory / Rakuten feed | `FEED_URL_MYER` |
| David Jones | Block page | Akamai | its network's feed | `FEED_URL_DAVIDJONES` |
| Target AU | Category pages 500 | | Rakuten / Commission Factory feed | `FEED_URL_TARGETAU` |
| Kmart | Walled | Akamai; Kmart runs no affiliate programme we know of | none yet | `FEED_URL_KMART` (if one appears) |
| Bunnings | Walled | Akamai; no affiliate programme | none | `FEED_URL_BUNNINGS` (if one appears) |
| Appliances Online | Single-page app | product sitemap exists (39,610 URLs); per-product JSON-LD possible later | direct (next round, heavy) | — |
| Scorptec, Centre Com, PB Tech | Client-rendered (Unbxd) / empty 202 / walled | | feed where they have one | — |
| Winning Appliances, e&s | Client-rendered / no prices in category HTML | | feed | — |
| Amazon AU, eBay AU | Live | Creators API, Browse API | | |

## United States

| Chain | Status | Why | Way in | Secret |
|---|---|---|---|---|
| **Best Buy** | **Ready** (`regions/us/bestbuy.ts`) | Walled (Akamai), but its free Products API needs only a key from developer.bestbuy.com (no affiliate approval); read by keyword per category once `BESTBUY_API_KEY` exists, Impact feed merged on top | API key, then Impact feed | `BESTBUY_API_KEY`, `FEED_URL_US_BESTBUY` |
| Walmart | Tiny block body | PerimeterX | Impact feed | `FEED_URL_US_WALMART` |
| Target | Client-rendered, keyed `redsky` API | key in page JS: not used by policy | Impact (Target Partners) feed | `FEED_URL_US_TARGET` |
| Home Depot | Walled | Akamai | Impact feed | `FEED_URL_US_HOMEDEPOT` |
| Lowe's | "Access Denied" | Akamai | CJ / Impact feed | `FEED_URL_US_LOWES` |
| Newegg | Walled | | Impact / own feed | `FEED_URL_US_NEWEGG` |
| B&H Photo | Walled | | own programme's feed | `FEED_URL_US_BHPHOTO` |
| Adorama | Walled | | Impact feed | `FEED_URL_US_ADORAMA` |
| Staples | Tiny block body | | Impact / CJ feed | `FEED_URL_US_STAPLES` |
| Office Depot | "We're Sorry" page | | CJ feed | `FEED_URL_US_OFFICEDEPOT` |
| GameStop | Walled | | Impact / CJ feed | `FEED_URL_US_GAMESTOP` |
| Sam's Club | Tiny block body | | Impact feed | `FEED_URL_US_SAMSCLUB` |
| Crutchfield | Walled | | CJ / Impact feed | `FEED_URL_US_CRUTCHFIELD` |
| Costco | GraphQL with a client id in page JS | not used by policy; no affiliate programme | none | `FEED_URL_US_COSTCO` (if one appears) |
| Micro Center | Walled | no affiliate programme | none | `FEED_URL_US_MICROCENTER` (if one appears) |
| Williams Sonoma | Walled | | Rakuten / CJ feed | `FEED_URL_US_WILLIAMSSONOMA` |
| Kohl's | Walled | | Impact / CJ feed | `FEED_URL_US_KOHLS` |
| Macy's | Walled | | Rakuten / Impact feed | `FEED_URL_US_MACYS` |
| Wayfair | Walled | | CJ / Impact feed | `FEED_URL_US_WAYFAIR` |
| BJ's Wholesale | Walled | | Impact / CJ feed | `FEED_URL_US_BJS` |
| Amazon, eBay | Live | APIs | | |

## United Kingdom

| Chain | Status | Why | Way in | Secret |
|---|---|---|---|---|
| Reliant | Dropped | its pages answered the probe but 403 the import (Cloudflare): a wall, not worked around | Awin feed if it has one | — |
| **Crampton & Moore** | **Live** | Magento, server-rendered cards | direct | — |
| Currys | Walled | Akamai | Awin feed | `FEED_URL_UK_CURRYS` |
| Argos | Walled | Akamai | Awin feed | `FEED_URL_UK_ARGOS` |
| AO | Walled | | Awin feed | `FEED_URL_UK_AO` |
| John Lewis | Walled | | Awin / Partnerize feed | `FEED_URL_UK_JOHNLEWIS` |
| Very | Walled | | Awin feed | `FEED_URL_UK_VERY` |
| Scan | Walled | Cloudflare | Awin feed | `FEED_URL_UK_SCAN` |
| Ebuyer | Walled | | Awin feed | `FEED_URL_UK_EBUYER` |
| Richer Sounds | Client-rendered | | Awin feed | `FEED_URL_UK_RICHERSOUNDS` |
| Smyths Toys | Challenge | | Awin feed | `FEED_URL_UK_SMYTHS` |
| GAME | Walled | | Awin feed | `FEED_URL_UK_GAME` |
| Costco UK | Walled | no affiliate programme | none | `FEED_URL_UK_COSTCOUK` (if one appears) |
| Robert Dyas | Walled | | Awin feed | `FEED_URL_UK_ROBERTDYAS` |
| Littlewoods | Walled | | Awin feed | `FEED_URL_UK_LITTLEWOODS` |
| The Entertainer | Walled | | Awin feed | `FEED_URL_UK_THEENTERTAINER` |
| Hamleys | Walled | | Awin feed | `FEED_URL_UK_HAMLEYS` |
| Ryman | Walled | | Awin feed | `FEED_URL_UK_RYMAN` |
| Jessops | 404 to servers | | Awin feed | `FEED_URL_UK_JESSOPS` |
| Marks Electrical | Client-rendered | | Awin feed | `FEED_URL_UK_MARKSELECTRICAL` |
| Appliances Direct | No card markup / 500 | | Awin feed | `FEED_URL_UK_APPLIANCESDIRECT` |
| CCL, Novatech, Tesco, Harrods, Selfridges, Sonic Direct, Sevenoaks, Donaghy Bros, Hifix, Electricshop | Walled, 404, 500, Cloudflare on page 2, or no card markup | | a later round | — |
| Amazon UK, eBay UK | Live | APIs | | |

## Adding a chain's feed later

`scripts/scrapers/categories/<id>.ts` (AU) or `regions/<us|uk>/<id>.ts`:

```ts
import { feedStore } from "../feed";
export const scrapers = feedStore({ retailer: "uk-currys", env: "FEED_URL_UK_CURRYS", currency: "GBP", cats: ["tvs", "laptops", …] });
```

plus the retailer in `src/lib/retailers*.ts` (and `RetailerId` for AU) and the secret in `refresh-prices.yml`'s env
block for that region. `tests/feed.test.ts` covers the reader.
