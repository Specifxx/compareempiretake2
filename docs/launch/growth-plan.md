# Compare Empire growth plan: launch to Black Friday (23 Oct – 1 Dec 2026)

**The one-line pitch everything hangs off:** *"Is that sale actually real?"* Every store, every day, with the price history to prove it.
Black Friday is **Friday 27 November**; every Australian tech buyer is asking that question for the next five weeks. That's the window.

What's already built into the site for this:
- **Share cards.** Any product, category or deals link pasted into Reddit, Facebook, Messenger, Discord or iMessage shows a card with the price, store count and price-check verdict.
- **Deals pages for every category** (`/deals/tvs`, `/deals/headphones`…), aimed at "{category} deals Australia" searches.
- **IndexNow.** The daily refresh tells Bing (which feeds DuckDuckGo, Yahoo and ChatGPT search) which prices changed.
- **Weekly email signup** on the home, deals and product pages. It appears once `NEXT_PUBLIC_NEWSLETTER_URL` is set (step 3).
- Fast pages (~60–300 KB), a sitemap with ~10,800 URLs, product structured data, and "{product} price in Australia" titles.

---

## This week: switch on the free channels (about 2 hours, once)

1. **Google Search Console** (prompt A below). Verify the site, submit `https://www.compareempire.com/sitemap.xml`, and request indexing for `/`, `/deals`, `/phones` and `/tvs`. Google is the biggest long-term source of visitors, and Search Console shows which searches people actually find you through.
2. **Bing Webmaster Tools** (prompt B). Import from Google Search Console in one click. IndexNow is already wired up.
3. **Free weekly email with Buttondown** (prompt C). It's free up to 100 subscribers, then cheap. Set the Vercel variable and the signup boxes appear. An email list is the only audience Google can't take away.
4. **Social handles:** reserve @compareempire on Instagram, TikTok, Facebook, Threads, Bluesky and Reddit (see `docs/strategy/social-media.md`, which has Claude in Chrome prompts).
5. **Cross-link your other sites.** Add "From the makers of Compare Empire" footer links on riftcompare, dexcompare and camcompare. That's an existing audience and a real backlink on day one.

## Weeks 1–3 (to 13 Nov): content that ranks, plus community trust

- **Twice a week, answer a real question with data, without linking.** "JB has the S26 Ultra at $1,999, Harvey Norman at $2,197, and it was $1,899 in September." Do it in r/australia's daily threads, r/frugal_aus, r/AusFinance's weekly thread, and Whirlpool's phone, TV and PC forums. Link only where a rule allows it. Being the person with the numbers earns the follows and DMs.
- **OzBargain:** post in "Talk with a Moderator" first (the message is in `docs/launch/feedback-posts.md`, POST 4). Never post your own site as a deal.
- **Publish a Black Friday tracker guide per big category** with live prices: TVs, headphones, laptops, consoles and graphics cards. Each becomes the page people bookmark.
- **One "data story" per week** for Reddit and the press. For example: "We tracked 10,000 prices for a month: here's what actually got cheaper", or "The 'was' prices we've never seen at those stores". Your price history is the moat, so show it off.
- **Short videos, three a week.** Screen-record the site: "Same TV, $700 apart at two stores", "This 'sale' was cheaper in September". Use TikTok, Reels and Shorts. They're cheap to make and the payoff is high-variance.

## Black Friday week (20 Nov – 1 Dec): the big push

- **Daily "Real deals vs fake deals" posts:** the home page deals list plus three "fake sale" callouts from the price-check data. Post them to the email list, socials and Reddit daily threads.
- **Press pitch (send around 16 Nov).** Write to Australian deal writers at Gizmodo AU, Lifehacker AU, Ausdroid, EFTM, Channel News and Mashable AU. Offer them data, not the launch: *"Free tool shows which Black Friday tech 'deals' are cheaper than September prices."* Deal writers need sources that week.
- **Product Hunt launch** on a Tuesday after Black Friday, for the backlink and the founder audience.
- **Watch Vercel Analytics daily:** top pages, referrers, and where visitors drop off.

## After 1 Dec: keep the loop running

- The weekly email goes out every Friday. Run the Boxing Day and EOFY versions of the tracker.
- **Price-drop alerts per product** ("email me if this goes under $X"). This is the strongest reason for repeat visits, and it needs a small database: Supabase or Neon free tier.
- **Affiliate links** once traffic is steady. Get an ABN first (it's free), and see `docs/strategy/monetization.md`.

## What to measure (weekly)

| Metric | Where | Goal by 1 Dec |
|---|---|---|
| Visitors per week | Vercel Analytics | 2,000+ |
| Search clicks per week | Search Console | 500+ |
| Pages indexed | Search Console | 3,000+ |
| Email subscribers | Buttondown | 300+ |
| Top referrers | Vercel Analytics | Reddit, Google, email |

These goals are aims, not forecasts.

---

## Claude in Chrome prompts

**A. Google Search Console**
```
Set up Google Search Console for https://www.compareempire.com.
1. Go to https://search.google.com/search-console and sign in (stop and let me sign in if needed).
2. Add a property using the "URL prefix" option: https://www.compareempire.com
3. Choose the "HTML tag" verification method. Copy ONLY the content="..." value from the meta tag it shows.
4. Open https://vercel.com, open the compareempiretake2 project → Settings → Environment Variables. Add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = <that value> for Production. Then go to Deployments and Redeploy the latest production deployment.
5. Wait until the redeploy is Ready, return to Search Console and click Verify.
6. In Search Console → Sitemaps, submit: sitemap.xml
7. Use URL Inspection → "Request indexing" for: https://www.compareempire.com/ , /deals , /phones , /tvs , /headphones
Tell me what's done and anything that needs me.
```

**B. Bing Webmaster Tools**
```
Set up Bing Webmaster Tools for https://www.compareempire.com.
1. Go to https://www.bing.com/webmasters and sign in (let me do the sign-in).
2. Choose "Import from Google Search Console" if it's offered, and import compareempire.com. Otherwise add the site manually, choose the meta-tag verification, copy the content value, add it in Vercel as NEXT_PUBLIC_BING_SITE_VERIFICATION (Production), redeploy, then verify.
3. Submit the sitemap https://www.compareempire.com/sitemap.xml
Tell me the result.
```

**C. Weekly email with Buttondown (free)**
```
Set up a free newsletter for Compare Empire with Buttondown.
1. Go to https://buttondown.com and create an account with username "compareempire" (let me handle sign-up and email verification). Use the business email if I have one.
2. In Settings: newsletter name "Compare Empire — Real Deals Weekly", description "The week's genuine price drops and the fake sales, every Friday." Turn ON double opt-in.
3. Find the embed form's action URL (it looks like https://buttondown.com/api/emails/embed-subscribe/compareempire).
4. In Vercel → compareempiretake2 → Settings → Environment Variables, add NEXT_PUBLIC_NEWSLETTER_URL = that URL for Production, then redeploy.
5. Open https://www.compareempire.com/deals after the deploy and confirm a "Get the weekly real-deals email" box appears near the bottom. Don't submit it.
Tell me what's done.
```
