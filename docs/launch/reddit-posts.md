# Reddit posts: US launch (ready to paste)

Numbers are from the site's own data, checked 24 October 2026. Prices change daily, so open each link
before posting and update any number that moved. Every link below returned 200 on 25 October.

How to post: in Reddit choose **Markdown Editor** (not Fancy Pants), paste the title into the title box and
everything inside the code block into the body.

Posting order (one or two a day, never the same text twice in a day, reply to every comment):
1. r/SideProject → 2. r/IMadeThis → 3. r/alphaandbetausers → 4. r/webdev (Saturday only) →
5. r/nextjs → 6. r/buildinpublic → 7. r/coolgithubprojects → 8. r/startups (monthly thread comment) →
then the shopper comments in section 9 whenever a matching question comes up.

Check each sub's sidebar rules before posting; they change. If a sub says no self promotion, use the
section 9 style instead: answer a question with the numbers, link only if someone asks.

---

## 1. r/SideProject

**Title:**
I built a free price tracker for 26 US electronics stores that aren't Amazon. Same LG C5 77" OLED is $424 apart.

```markdown
Hey r/SideProject. I've been building **Compare Empire**, a price comparison site for electronics, as a side project. It started in Australia and this week I launched it in the **US** and the UK.

**What it does**

Every morning it checks the prices at 26 US stores, matches the same product across them, and lists the cheapest in stock price first. It saves every price, every day, so you can see whether a "sale" is actually a sale.

**Some real gaps it found on 24 October**

| Product | Cheapest | Dearest | Gap |
|---|---|---|---|
| Samsung The Frame Pro 85" | $3,297.99 at Abt | $4,299.99 at Audio Advice | **$1,002** |
| LG OLED evo C5 77" | $1,776 at Abt | $2,199.99 at LG | **$424** |
| LG 39" UltraGear GX9 5K2K OLED | $1,599 at Focus Camera | $1,799.99 at LG | **$201** |
| LG QNED75B 75" | $649.99 at Abt | $799.99 at LG | **$150** |
| Sennheiser Momentum 5 | $299.95 at Audio46 | $399.95 at Headphones.com | **$100** |
| iPad Pro 13" M5 1TB Wi Fi | $1,994 at Abt | $2,099 at Apple | **$105** |

**What's in it today**

* 26 US stores, including Abt, Focus Camera, World Wide Stereo, Audio Advice, Headphones.com, Audio46, and the Apple, Dell, LG, Bose, Sonos and Garmin stores
* About 5,500 products across TVs, headphones, speakers, soundbars, laptops, monitors, cameras, smartwatches and robot vacuums
* No store pays to rank higher. Cheapest in stock first, always.

**What it doesn't do (yet)**

Best Buy, Walmart, Target, B&H and Newegg all block automated price checks, so they're not in it. I'm applying for Best Buy's official API. Price history in the US also only starts this week, so the "is this a real sale" check gets better every day.

Link: https://www.compareempire.com/us

I'd really like feedback on:

1. Is it obvious on a product page whether the price is good?
2. Which US stores should I add next? Independents that sell new stock are perfect.
3. Anything broken or any price that looks wrong?

Thanks for looking!
```

---

## 2. r/IMadeThis

**Title:**
I made a site that checks 26 US electronics stores every morning and shows who's cheapest today

```markdown
**Compare Empire US:** https://www.compareempire.com/us

It checks Abt, Focus Camera, World Wide Stereo, Audio Advice, Headphones.com, Audio46 and the brand stores (Apple, Dell, LG, Bose, Sonos, Garmin and more) every day, matches the exact same product across them, and sorts by the cheapest in stock price.

A few things it caught on 24 October:

* **LG OLED evo C5 77"**: $1,776 at Abt vs $2,199.99 direct from LG
* **Samsung The Frame Pro 85"**: $3,297.99 at Abt vs $4,299.99 at Audio Advice
* **Sennheiser Momentum 5**: $299.95 at Audio46 vs $399.95 at Headphones.com
* **iPad Pro 13" M5 1TB**: $1,994 at Abt vs $2,099 at Apple

It saves every price every day, so over time each product page shows whether a "was" price was ever real.

Free, no account, no ads in the rankings. Feedback very welcome, especially stores you'd want added.
```

---

## 3. r/alphaandbetausers

**Title:**
Looking for testers: free US price comparison for TVs, headphones, laptops and monitors (26 stores)

```markdown
**What it is:** Compare Empire, a price comparison site that checks 26 US electronics stores every day and saves the price history, so you can tell a real sale from a fake one.

**Link:** https://www.compareempire.com/us

**What I'd love you to try (5 minutes):**

1. Search for something you're actually thinking of buying.
2. Open the product page. Is it clear which store is cheapest and whether that price is good?
3. Click through to the store. Was it the right product at the price we showed?
4. Tell me one thing that confused you and one store you wish was there.

**Where it is today:** about 5,500 products, 26 stores (Abt, Focus Camera, World Wide Stereo, Audio Advice, Headphones.com, Audio46, Apple, Dell, LG, Bose, Sonos, Garmin and more). Example: the LG C5 77" OLED was $1,776 at Abt and $2,199.99 at LG on 24 October.

**Known gaps:** no Best Buy, Walmart, Target, B&H or Newegg (they block automated checks), and US price history only started this week.

Every reply gets a response from me. Thank you!
```

---

## 4. r/webdev (Showoff Saturday posts only)

**Title:**
[Showoff Saturday] A price comparison site with 29k static pages across three countries, rebuilt every morning

```markdown
**Site:** https://www.compareempire.com/us (US), https://www.compareempire.com/uk (UK), root is Australia

**What it is:** a price comparison site for electronics. A GitHub Action scrapes 26 US, 22 UK and 30+ Australian stores every morning, matches the same product across stores, writes JSON into the repo, and Vercel rebuilds about 28,800 static pages from it.

**Bits that might interest you:**

* **Matching** is the hard part. Model codes and part numbers first, then a strict bag of words with per category noise lists. A wrong merge is worse than a missed one, so it refuses rather than guesses.
* **Regions without breaking URLs:** Australia stays at the root and the US and UK live under /us and /uk, all from the same views with a region argument. Product objects carry their region, so links, currency and price checks follow automatically.
* **Cost:** everything is static, so it runs on the CDN. The search index is a lazily loaded static JSON file.
* **What broke:** a UK laptop with a 240 character name made a file name over the 255 byte limit and killed the build. Slugs are capped now.

Real output from 24 October: the LG C5 77" OLED was $1,776 at Abt and $2,199.99 at LG.

Happy to answer anything about the scraping, matching or build.
```

---

## 5. r/nextjs

**Title:**
How I added US and UK versions to a 10k page Next.js site without changing a single existing URL

```markdown
I run a price comparison site (Next.js 15 App Router, fully static). It launched in Australia with about 10,800 pages at the root. This week I added the US and UK, and the brief to myself was: **no existing URL changes, no duplicated page code.**

**What I did**

1. **Data per region:** `data/<category>` stays Australian, new regions go in `data/us/<category>` and `data/uk/<category>`. The catalogue loader reads each region once at build.
2. **Products carry their region.** The loader stamps `region` on each product, so `productHref(p)`, the price history and the "is this a good price" check need no extra argument. That cut the refactor from about 30 call sites to about 8.
3. **Shared views, thin routes.** The page bodies moved to `src/views/*View.tsx`, which take a `region` prop. `app/[category]/page.tsx` renders it with `"au"`; `app/us/[category]/page.tsx` and `app/uk/...` are 10 line wrappers. Static folders beat the dynamic `[category]` segment, so there's no clash.
4. **Client components read the region from the path** (`usePathname`), so headers, search and prices pick the right currency with no provider.
5. **SEO:** each country gets its own canonical, hreflang alternates when the same product exists elsewhere, and the sitemap includes all three.

**Result:** about 28,800 static pages, a local build in about 7 minutes, and the Australian pages kept the same titles, canonicals and schema.

**Gotcha:** a UK laptop name produced a slug long enough to blow the 255 byte file name limit during export (`ENAMETOOLONG`). Cap your slugs.

Live: https://www.compareempire.com/us
```

---

## 6. r/buildinpublic

**Title:**
Week 1 of taking my price comparison site from Australia to the US: 26 stores, 5,500 products, and the stores that blocked me

```markdown
Building in public update for **Compare Empire**, a free price comparison site for electronics.

**Where it was:** Australia only, about 10,800 products from 30+ stores.

**This week:** launched the US and UK.

**US numbers**

* 26 stores working, about 5,500 products, 7,520 prices checked every morning
* 259 products already matched across two or more stores (that's where the savings show up)
* Biggest gap found on 24 October: Samsung The Frame Pro 85" at $3,297.99 at Abt vs $4,299.99 at Audio Advice

**What didn't work**

Best Buy, Walmart, Target, B&H, Newegg, Micro Center and Crutchfield all block automated price checks. I'm applying for Best Buy's official API. For now the US site leans on great independents (Abt, Focus Camera, World Wide Stereo, Audio Advice, Audio46, Headphones.com) plus the brand stores.

**What's next**

1. More US independents
2. Get indexed (sitemap went from 10,800 to 28,800 URLs)
3. Find out which stores people actually click through to (click tracking is live)

Site: https://www.compareempire.com/us

If you've grown a US audience for a consumer site from zero, I'd love to hear what worked first.
```

---

## 7. r/coolgithubprojects

**Title:**
Compare Empire: open source price comparison for electronics in the US, UK and Australia (TypeScript, Next.js)

```markdown
**Repo:** https://github.com/specifxx/compareempiretake2
**Live:** https://www.compareempire.com/us

A daily GitHub Action scrapes 26 US, 22 UK and 30+ Australian electronics stores, matches identical products across them, and commits the prices as JSON. Next.js turns that into about 28,800 static pages with price history charts and a "is this sale real" check.

**Interesting folders**

* `scripts/scrapers/regions/us/`: one file per store (Shopify feeds, JSON LD, public listing JSON)
* `src/lib/match-more.ts`: cross store product matching that refuses rather than guesses
* `src/lib/price-check.ts`: turns daily history into a plain verdict ("lowest we've recorded", "above its usual price")

Example output: the LG C5 77" OLED was $1,776 at Abt and $2,199.99 at LG on 24 October.

Stars and store suggestions welcome.
```

---

## 8. r/startups ("Share your startup" monthly thread: comment, don't post)

```markdown
**Compare Empire** (https://www.compareempire.com/us)

**What:** free price comparison for electronics that checks 26 US stores daily (plus the UK and Australia) and keeps every price, so you can see if a sale is real.

**Stage:** live, pre revenue. About 5,500 US products today; US launch was this week.

**Example:** the LG C5 77" OLED was $1,776 at Abt and $2,199.99 at LG on 24 October.

**Looking for:** feedback on the product page, US store suggestions, and anyone who's done affiliate partnerships with US electronics retailers.

**Discount for Reddit:** it's free.
```

---

## 9. Shopper communities: comments, not posts

These subs mostly ban self promotion, so don't post the site. When someone asks "where's the cheapest X",
answer with the numbers first. Add the link only if the sub allows it or someone asks where you got them.
Rewrite in your own words each time; copied text gets flagged.

**r/OLED_Gaming, r/4kTV, r/hometheater** (when someone's pricing an LG C5 77"):

```markdown
Worth checking Abt before buying direct. On 24 October the C5 77" was $1,776 at Abt vs $2,199.99 on LG's own store, same model. I track prices across a bunch of US stores for a side project and that one's been one of the bigger gaps.
```

**r/headphones** (when someone asks about the Momentum 5):

```markdown
Prices on the Momentum 5 vary more than you'd think. On 24 October it was $299.95 at Audio46 and $399.95 at Headphones.com for the same black pair. Worth checking both before you buy.
```

**r/ipad, r/AppleWhatShouldIBuy** (when someone's about to buy an iPad Pro M5 from Apple):

```markdown
If you don't need Apple's engraving or trade in, Abt was about $85 to $125 under Apple's price on most iPad Pro M5 configs on 24 October (for example the 13" 1TB Wi Fi was $1,994 vs $2,099). Authorized dealer, so same warranty.
```

**r/Monitors, r/ultrawidemasterrace** (LG 39" GX9):

```markdown
For the LG 39" GX9 5K2K OLED, Focus Camera had it at $1,599 on 24 October vs $1,799.99 direct from LG.
```

If someone asks where the numbers come from: "I built a free tracker for this, https://www.compareempire.com/us. No ads, cheapest in stock first."
