# US and UK launch plan

Live from 25 October 2026: **compareempire.com/us** (26 US stores, about 5,500 products) and
**compareempire.com/uk** (22 UK stores, about 12,400 products). Australia stays at the root.

What to lead with, in this order:
1. **The UK.** It is the stronger site: Box, Laptops Direct, Overclockers, Clove and HP, Dell and Apple, with
   real overlap in laptops, monitors, graphics cards, RAM and CPUs. Lead UK posts with PC parts and laptops.
2. **The US.** It is thinner, because Best Buy, Walmart, B&H and Newegg block us. Abt, Focus Camera, World Wide
   Stereo, Audio Advice and the brand stores work. Pitch it as a side project and a call for feedback, not as
   "the best US price comparison".

The honest hook for both: *"Most price trackers follow Amazon. We follow the shops Amazon competes with."*
Price history starts on 24 Oct, so every price check says "Tracking this price" for now. Don't claim long
history in the US or UK until about four weeks have passed.

---

## Week 1: get indexed (do this first; it is the setup prompt below)

- Google Search Console: the property already covers `/us` and `/uk`. Resubmit `sitemap.xml`, then request
  indexing for `/us`, `/uk`, `/uk/laptops`, `/uk/graphics-cards`, `/uk/monitors`, `/us/headphones` and `/us/tvs`.
  In **Settings → International targeting** nothing is needed: hreflang tags are on every page.
- Bing Webmaster Tools: resubmit the sitemap. IndexNow now pings changed US and UK pages every day.
- Ask nothing of Google beyond that; new sections usually take 1–4 weeks to show up in search.

## Week 1–2: builder communities (self-promotion allowed, or in a weekly thread)

| Where | Rule to check | Post |
|---|---|---|
| r/SideProject | Allows launches | POST A |
| r/IMadeThis | Allows launches | POST A |
| r/webdev, **Showoff Saturday** only | Saturdays only | POST A (shortened) |
| r/nextjs | "Built with Next.js" flair; talk about the build | POST C |
| r/InternetIsBeautiful | No self-promo; skip unless someone else posts it | — |
| Indie Hackers → Products + a "milestone" post | Allowed | POST A |
| Hacker News **Show HN** | Weekday morning US time, plain title, answer every comment | POST B |
| Product Hunt | After 2–3 weeks of fixes, on a Tuesday | — |

## Week 2–4: shoppers (contribute first, link only where allowed)

- **UK:** r/buildapcuk (answer part-price questions with numbers; link only if asked), the HotUKDeals forum
  ("Misc" discussion; never post your own site as a deal), r/UKPersonalFinance (no links; it's useful only
  for spotting questions), and the Overclockers UK forums (read the rules on links first).
- **US:** r/buildapcsales (deals only, never your site), r/headphones (Audio46, Headphones.com and Abt prices are
  strong; answer "where's cheapest" with numbers), Slickdeals forums (no self-promo), r/frugal (no links).
- The pattern that works: answer with the numbers ("Box has the 9800X3D at £429, Overclockers £449, Laptops
  Direct £459"), and add the link only where the sub allows it or someone asks.

## Measure (Vercel Analytics, filter by path prefix)

- Visitors to `/us/*` and `/uk/*` separately, top referrers, and `buy_click` by retailer. The
  retailers people click are the ones to apply to for affiliate programmes first (most UK stores use Awin;
  most US stores use CJ, Impact or AvantLink).

---

## POST A: side project launch (r/SideProject, r/IMadeThis, Indie Hackers)

**Title:** I built a price comparison site that tracks 48 US and UK electronics stores every day, not just Amazon

Hey all. I've been building Compare Empire, a price comparison site for electronics, as a side project. It started
in Australia, and this week I launched it in the UK and the US.

What it does: every morning it checks prices at 22 UK stores (Box, Laptops Direct, Overclockers, Clove, the
Apple, Dell and HP stores…) and 26 US stores (Abt, Focus Camera, World Wide Stereo, Audio Advice, brand stores…),
matches the same product across stores, and lists the cheapest in-stock price first. It saves every price, every
day, so when a store says "was £1,499" you can see whether it ever was.

UK: https://www.compareempire.com/uk
US: https://www.compareempire.com/us

Things I'd love feedback on:
1. Is the product page clear on whether a price is actually good?
2. Which stores should I add? (Currys, Argos, Best Buy and Walmart block automated price checks, so I'm looking
   for good independents.)
3. Anything broken, or a price that's wrong?

No ads in the rankings, and no store pays to be listed. Some eBay links are affiliate links, and they're labelled.

## POST B: Show HN

**Title:** Show HN: Compare Empire – daily price history across 48 US and UK electronics stores

Body: two sentences on what it is, then the interesting part for HN: how products are matched across stores
(model codes and part numbers first, then a strict bag-of-words with per-category noise lists; a wrong merge is
worse than a missed one), that the whole site is static and rebuilt from JSON in the repo every morning, and what
blocks scraping (Cloudflare and Akamai on most big US chains). Link the UK page. Then stay and answer comments.

## POST C: r/nextjs (the build, not the product)

**Title:** 29k static pages, three countries, one Next.js app: how I added regions without changing a single
existing URL

Body: Australia at the root and the US and UK under `/us` and `/uk`, built from shared views, one data folder per
region, prerendered from JSON at build, a CDN-only cost profile, and what broke (a 255-byte file name limit on one
very long laptop slug). Link at the end.

---

## Claude in Chrome setup prompt

```
You are helping me finish the US and UK launch of https://www.compareempire.com (new sections /us and /uk).
Use the business accounts on compareempire@outlook.com.

RULES — follow these exactly:
1. Never stop and wait for me. Every task gets its OWN new tab.
2. Before each task, CHECK whether it's already done. If it is, note "already done" and move on.
3. If any step needs me (sign-in, password, 2FA/email code, CAPTCHA, "verify you're human", a permission prompt, anything you can't or shouldn't do), STOP that task right there: leave its tab open on that exact screen, fill in everything else you can on that page first, note exactly what I need to do, then IMMEDIATELY go to the next task in a new tab. Do not retry or wait.
4. If a later task depends on a blocked one, do every part you can, leave that tab open too, and note the dependency.
5. Never pay for anything, never post or publish anything, never change passwords or account emails.
6. When every task has been attempted, finish with:
   A) A results table: task | done / already done / waiting on me / failed | one-line note.
   B) "MY MANUAL STEPS": a numbered checklist, in the order I should do them, one line each:
      tab title or URL → exactly what to click/type → what to tell you afterwards (if anything).
      Keep the tabs in the same order as this list.
I'll do the manual steps and run this prompt again; on the re-run, skip everything already done and pick up where I left off.

TASK 1. Google Search Console
Open https://search.google.com/search-console and pick the property https://www.compareempire.com/.
a. Sitemaps: submit "sitemap.xml" again (or click it and confirm the status is Success and the discovered URL count went up from about 10,800 to about 28,800).
b. URL Inspection → "Request indexing" for each of these, one at a time (stop when Google says the daily quota is reached and tell me which ones are left):
   https://www.compareempire.com/uk
   https://www.compareempire.com/us
   https://www.compareempire.com/uk/laptops
   https://www.compareempire.com/uk/graphics-cards
   https://www.compareempire.com/uk/monitors
   https://www.compareempire.com/us/headphones
   https://www.compareempire.com/us/tvs
   https://www.compareempire.com/uk/deals
   https://www.compareempire.com/us/deals
c. Settings: if there is a Users and permissions page, check that compareempire@outlook.com is an Owner.

TASK 2. Bing Webmaster Tools
Open https://www.bing.com/webmasters, choose compareempire.com, go to Sitemaps and resubmit https://www.compareempire.com/sitemap.xml. Then URL Submission: submit https://www.compareempire.com/uk and https://www.compareempire.com/us.

TASK 3. Vercel environment variable (fixes the sitemap host)
Open https://vercel.com → project compareempiretake2 → Settings → Environment Variables. If NEXT_PUBLIC_SITE_URL is missing, add NEXT_PUBLIC_SITE_URL = https://www.compareempire.com for Production. Do not redeploy; the next daily update will pick it up.

TASK 4. Vercel Analytics check
Open the project's Analytics tab and confirm there's an "Events" section. Look for an event called buy_click and tell me the top 5 values of "retailer" if any exist. Don't change anything.

TASK 5. Reddit and Indie Hackers drafts (don't post anything)
Open https://www.reddit.com/r/SideProject/submit and paste POST A from https://github.com/specifxx/compareempiretake2/blob/claude/admiring-newton-5xtu2p/docs/launch/us-uk-launch.md as a text post. Don't click Post: leave the tab for me. Do the same at https://www.indiehackers.com/new-post if I'm signed in.

TASK 6. Best Buy developer API (optional, for US coverage)
Open https://developer.bestbuy.com and start the free sign-up with compareempire@outlook.com, app name "Compare Empire", description "Price comparison and price history for consumers". Stop at email verification and tell me. (Once I have a key, Claude can add Best Buy to the US site.)
```
