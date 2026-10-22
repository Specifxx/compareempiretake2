# Compare Empire strategy

*Drafted 2026-10-22, launch day (phones, Australia, 158 models, 4 retailers).*

**How to read the sources.** URLs are inline. **[UNVERIFIED]** marks a claim I could not confirm with a source during this research: it is either from memory or an estimate. Check those before relying on them in public copy or decisions.

---

## 1. Vision, mission, values

**Vision:** Every Australian knows the real price before they buy.

**Mission:** We show honest, like-for-like prices from Australian retailers, with the history that proves whether a deal is real. Nobody can pay to rank higher.

**Core values**
1. **Real prices only.** Every number comes from a retailer page we checked, with the date we checked it.
2. **Nobody buys rank.** The order is price and stock. Affiliate links never change it.
3. **Like-for-like or nothing.** A 128 GB phone is a different product from a 256 GB one.
4. **Fast and quiet.** No ads in the way, no sign-up wall, no pop-ups.
5. **Show our working.** Our methods, sources and conflicts of interest are published.

---

## 2. Value proposition

**One-liner:** *The honest price for the exact phone you want, from Australian stores that have it in stock, with the history to prove whether it's a real deal.*

### Where we beat Google Shopping for an Australian phone buyer

| Advantage | Why it holds up |
|---|---|
| **Storage-level matching** | Google groups offers loosely, so a "from $X" price is often a smaller-storage model, a grey import or a refurbished unit. We match model + storage + condition (new, unlocked) exactly. |
| **Honest price history that exposes fake sales** | Inflated "was" prices are a live problem in Australia. The ACCC looked at JB Hi-Fi "was" prices on 17 products, some never actually charged at that price ([HWL Ebsworth](https://hwlebsworth.com.au/dubious-discounts-real-consequences-accc-targets-was-now-pricing-tactics/)). It is suing Coles and Woolworths over illusory discounts ([CHOICE](https://www.choice.com.au/shopping/everyday-shopping/supermarkets/articles/accc-takes-coles-and-woolworths-to-court-for-fake-discounts)). Its Black Friday sweep found about half of 50 retailers made "concerning" claims ([The New Daily, 2026](https://www.thenewdaily.com.au/finance/consumer/2026/06/11/retail-sales-traps-rife)). Google Shopping shows little or no retailer-level history in AU **[UNVERIFIED: check the current UI]**. Our daily history is the evidence. |
| **No paid ranking** | Google Shopping is mostly an ad product: merchants pay per click for placement. The EU fined Google €2.42 bn in 2017 for favouring its own shopping service ([TechCrunch](https://techcrunch.com/2017/06/27/google-fined-e2-42bn-for-eu-antitrust-violations-over-shopping-searches/)). The ACCC's guide for comparison sites says operators should not take fees for preferred placement and must clearly label sponsored results ([Brightlaw summary](https://www.brightlaw.com.au/guide-for-comparator-website-operators-and-suppliers/)). Our ranking rule is public and money cannot change it. |
| **Australian retailers only, with stock** | No overseas marketplace sellers, grey imports with no AU warranty, or dropshippers. Each listing comes from a known AU retailer and is covered by Australian Consumer Law. |
| **Speed and focus** | A static site, instant typo-tolerant search and no ad slots. A phone page answers "where is it cheapest today, and is that a good price?" in one screen. |
| **Expert, category-specific content** | Buying guides such as "which Pixel storage size", "is the S-series dropping soon" and "best phone under $600", written around our own price data. Google's aggregator can't write these. |

### Where Google wins (don't fight these)
- **Breadth and the reach of the search box.** Google covers millions of products and is where shopping starts. Our job is to rank *on* Google, not to replace it.
- **Merchant feeds.** Retailers send Google live price and stock data. We scrape once a day, so we will sometimes be hours behind. Say so on the page ("checked 6:10am").
- **Its ecosystem.** Google Lens, reviews pulled together from everywhere, Gemini answers, Android, Chrome.

**Don't compete on:** catalogue size, real-time pricing, marketplace sellers, a general "search everything" box, or ad spend. Win on depth, honesty and AU specifics, one category at a time.

---

## 3. Positioning vs competitors

| Competitor | What it is / how it grew | How it makes money | Common complaints | Our angle |
|---|---|---|---|---|
| **Google Shopping** | Built into Google Search. Grew through search dominance; the EU found it self-preferenced ([TechCrunch](https://techcrunch.com/2017/06/27/google-fined-e2-42bn-for-eu-antitrust-violations-over-shopping-searches/)) | Merchant ads (CPC); free listings since 2020 **[UNVERIFIED]** | Sponsored results everywhere, mismatched variants, overseas sellers, scam stores **[UNVERIFIED: anecdotal, Reddit]** | Exact matching, no paid rank, AU only, history |
| **PriceSpy / PriceRunner (Klarna)** | Nordic giants. PriceRunner earned SEK 460 m in revenue at a 52% adjusted EBITDA margin before Klarna bought it in 2021 ([Crowdfund Insider](https://www.crowdfundinsider.com/2021/11/182436-fintech-klarna-acquires-pricerunner-to-enhance-banking-offer-for-global-consumers/)). PriceSpy ran an AU site that has since wound down **[UNVERIFIED: no source found]** | CPC from retailers, Klarna checkout | Retailers pay to be listed, so stores that don't pay are missing **[UNVERIFIED]** | We list stores whether or not they pay. Proof that CPC comparison is a strong business at scale. |
| **Idealo / Kelkoo** | Large European CPC comparison sites. Kelkoo shrank after Google squeezed it out of organic search **[UNVERIFIED]** | CPC and lead fees | Feeds go stale, too much SEO filler | Show they live or die on Google traffic. Diversify (email, direct). |
| **Shopbot / Getprice (AU)** | Early-2000s Australian aggregators. Still listed, but their profile has faded ([StackShare](https://stackshare.io/companies/shopbot-australia)). Their decline is not well documented **[UNVERIFIED]** | Merchant feeds, CPC | Outdated listings, low-quality catalogue | What failure looks like: broad, shallow and dependent on merchant feeds. We go deep and stay fresh. |
| **OzBargain** | Community deal-voting site, a huge and trusted AU audience **[UNVERIFIED: traffic size]** | Ads, some affiliate | Hit or miss, only for bargain hunters, not for "I need a phone now" | Complement, don't compete. Post genuinely good deals there, honestly and as ourselves. |
| **Camelcamelcamel / Keepa** | Amazon price-history trackers, grown on alerts and charts | Amazon affiliate; Keepa subscription | Amazon only | We give the same history-plus-alerts value for every AU phone retailer |
| **Honey (PayPal)** | Coupon extension, bought for US$4 bn **[UNVERIFIED]** | Affiliate commissions | Accused of overwriting creators' affiliate cookies, now facing a class action ([Wikipedia](https://en.wikipedia.org/wiki/PayPal_Honey), [PPC Land](https://ppc.land/paypals-honey-faces-class-action-lawsuit-over-affiliate-commission-practices/)) | A warning: never hijack attribution. Any extension we build must be openly honest about this. |
| **PriceHipster (AU)** | Supermarket price comparison **[UNVERIFIED: details]** | Ads | Groceries only | Different category. Possible partner. |

---

## 4. Roadmap, ranked by impact divided by effort (solo dev)

| # | Idea | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **"Is this a good price?" verdict** on every phone (today vs 30/90-day low, flag for a fake "was" price) | High | Low | Uses data we already have. It is the core of the differentiation and it gives pages content Google can index. |
| 2 | **Price-drop email alerts** (no account: email plus a confirmation link) | High | Low–Med | Builds an owned audience, which offsets the dependency on Google. A free-tier email service is enough at the start. |
| 3 | **More retailers:** Officeworks, Big W, Amazon AU, JB/Telstra outright, Kogan | High | Med | Each new retailer improves every page. Amazon AU through PA-API/Associates needs qualifying sales first **[UNVERIFIED: current thresholds]**. |
| 4 | **Buying guides and editorial pages** ("Best phone under $X", "Pixel vs Galaxy") | High (SEO) | Med | Guards against a thin-content penalty. Use real data, not filler. |
| 5 | **Affiliate links** (Commission Factory, Partnerize, Amazon) | Med (revenue) | Low | Turn on early, disclose clearly, and never let them change the ranking. |
| 6 | **Category #2: laptops** (see below) | High | Med–High | |
| 7 | **Trade-in values** (retailer and carrier trade-in offers) | Med | Med | Pages are sticky, but prices change constantly. |
| 8 | **Total cost of ownership with plans** (outright plus SIM vs a carrier plan) | Med | High | Useful, but plan data is messy and the ACCC watches telco comparison closely. Later. |
| 9 | **Community deal submissions and voting** | Low–Med | High | Moderation load, and OzBargain already owns this. Skip for now. |
| 10 | **Browser extension** | Med | High | Store review and upkeep are costly, and the Honey scandal makes users wary. Year 2 or later. |

### Category #2: laptops (then tablets, headphones, TVs)
- **Search demand:** "best laptop", "macbook air price" and similar queries are high-volume in AU year-round, with peaks around back-to-school and EOFY **[UNVERIFIED: confirm in Google Trends / Keyword Planner]**.
- **Scrapability:** the same four retailers plus Officeworks sell laptops, so the existing scrapers can be reused.
- **Matching value:** even stronger than phones. CPU, RAM, storage and screen variants make like-for-like matching a real product, not a gimmick.
- **Affiliate:** higher average order value (about $1.5k vs $1.2k) **[UNVERIFIED]**. Electronics commission is low, roughly 1–4% **[UNVERIFIED]**.
- **Why not watches or cars yet:** watches split into luxury and grey market. Cars are lead-gen and dealer-based, a different business with heavy incumbents.

---

## 5. OKRs

The baselines are launch-day guesses. Re-baseline after 30 days of Search Console data.

### Next 90 days (to about 2027-01-20)
- **O1: Get found.**
  - KR: 300+ pages indexed in Google Search Console.
  - KR: 5,000 organic visitors a month by month 3.
  - KR: Top-10 ranking for 20 "[model] price australia" queries.
- **O2: Own the audience.**
  - KR: Price alerts shipped.
  - KR: 500 email subscribers.
  - KR: 10% of alert emails lead to a click-out.
- **O3: Be the most complete.**
  - KR: 7 retailers covered.
  - KR: 200+ phone models.
  - KR: 99% of prices less than 24 hours old.
- **O4: Prove the honesty claim.**
  - KR: A "good price?" verdict on 100% of pages.
  - KR: One data story (for example a "Black Friday fake-discount" report) picked up by AU media or OzBargain.

### 12 months (to 2027-10)
- **Traffic:** 50,000 monthly visitors; 25% of them direct, email or returning (less dependence on Google).
- **Catalogue:** 3 categories (phones, laptops, tablets or headphones); 10+ retailers; 3,000+ indexed pages, every one with unique data on it.
- **Audience:** 5,000 subscribers.
- **Revenue:** Affiliates live, covering hosting with a surplus; first $500 a month in revenue.
- **Business:** Trademark filed; decision made on Pty Ltd.

---

## 6. Risks and mitigations

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Scraping blocked** (Cloudflare, bot walls) | High / High | Polite crawl rate, one request per product a day, cached HTML, a UA that identifies us. Join retailers' affiliate programs to get product feeds. Diversify retailers so losing one isn't fatal. |
| **Legal / ToS** (retailer terms forbid scraping; copyright in images and descriptions) | Med / High | Collect only facts (price, stock). Write our own specs and use manufacturer images or none. Comply quickly with any cease-and-desist. Get legal advice before scaling **[not legal advice]**. |
| **ACCC comparator rules / misleading conduct** | Low–Med / High | Follow the ACCC comparator guidance: disclose how we earn money and which retailers we cover, and label anything sponsored ([Brightlaw](https://www.brightlaw.com.au/guide-for-comparator-website-operators-and-suppliers/)). Timestamp every price. |
| **Google dependency** (core updates, AI Overviews taking clicks) | High / High | Email alerts, return visits, OzBargain and Reddit presence. Data stories that earn links. Kelkoo and the EU shopping case show what happens otherwise. |
| **Thin-content / scaled-content penalty** | Med / High | Every indexed page carries unique data (history, verdict, matched offers). Noindex pages with no offers. Write editorial for the top models. |
| **Stale or wrong prices** | Med / Med | Freshness monitor, auto-hide offers more than 48 hours old, a "report wrong price" link. |
| **Solo founder bus factor / burnout** | High / High | Automate scrapers with alerting. Keep the stack at $0. Write runbooks. One category at a time. |
| **Free-tier limits** (Vercel, scraper compute) | Med / Med | Static output, daily builds, monitoring of usage. |

---

## 7. Business structure (not legal or tax advice; see an accountant)

1. **Now: sole trader with an ABN.** An ABN is free ([ABR](https://www.abr.gov.au)). Register the business name "Compare Empire" with ASIC (about $45 for a year **[UNVERIFIED: current fee]**). Register for GST only once turnover reaches $75k.
2. **Move to a Pty Ltd** when there is meaningful revenue (rough rule: profit above about $100k, or liability exposure from legal or scraping disputes), when taking investors or partners, or before selling. ASIC registration costs roughly $600 or more plus an annual review fee **[UNVERIFIED: current fees]**. Move the IP, domains and contracts into the company at that point.
3. **Trademark "Compare Empire"** through IP Australia. Pick-list applications cost about **$250 per class** (bespoke wording about $400; Headstart $330) ([Sprintlaw](https://sprintlaw.com.au/articles/ip-australia-trade-mark-fees-explained/), [LegalVision](https://legalvision.com.au/trade-mark-cost)). Suggested classes are 35 (online comparison and retail information) and possibly 42 (SaaS/platform), so about $500 in total. Search TM Checker first; "compare" alone is descriptive, but the combined mark is likely registrable **[UNVERIFIED]**. Consider the same for RiftCompare and the other brands later.
4. **Ownership hygiene, starting now:**
   - Register every domain (compareempire.com plus the .com.au, which needs an ABN) in the founder's own registrar account, with 2FA and auto-renew on.
   - Put GitHub, Vercel, email, analytics, Search Console and the affiliate accounts under a business email on the founder's domain, not a personal Gmail.
   - Keep a password-manager vault and a record of which accounts belong to which brand.
   - Open a separate bank account for the business from day one.
5. **Holding structure later:** if the sites stay separate brands, one Pty Ltd ("Compare Empire Pty Ltd") can own all of them (riftcompare, dexcompare, camcompare) as trading names.
