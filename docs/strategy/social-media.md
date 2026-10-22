# Compare Empire: social media and brand ops (at $0)

Last researched 2026-10-22. Platform limits change often. Anything marked **[verify]** came from third-party sources or could not be confirmed on an official page. Check it before relying on it.

Scope: compareempire.com is an independent Australian price-comparison site. It covers phones first, with daily prices from JB Hi-Fi, Harvey Norman, The Good Guys and Mobileciti. There is one founder, no ABN yet, and no budget.

---

## 1. Free business email (hello@compareempire.com)

| Option | Cost | Receive | Send as the domain | Notes |
|---|---|---|---|---|
| **Cloudflare Email Routing + Gmail "Send mail as"** | $0 | Forwarding only (no mailbox) | Yes, through Gmail's SMTP with an app password | You need to move the domain's nameservers to Cloudflare (free). Unlimited custom addresses. https://developers.cloudflare.com/email-routing/ |
| **ImprovMX free** | $0 | Forwarding | Sending SMTP is paid only **[verify]** | Works with any DNS provider, including Vercel. https://improvmx.com/pricing |
| **Zoho Mail Forever Free** | $0 | A real mailbox | Yes, from Zoho's web and mobile apps | Usually up to 5 users, 5 GB each, 1 domain. Sources disagree on whether IMAP/POP is included (they say it is not, so you can't use Outlook or Apple Mail) **[verify]** https://www.zoho.com/mail/zohomail-pricing.html · [itechguides](https://www.itechguides.com/best/email-hosting/zoho-mail/) · [websnp](https://www.websnp.com/help/zoho-mail-free-vs-paid-plans-nepal) |
| Google Workspace | ~A$10/user/mo | | | Not free. It is the natural upgrade once there is an ABN. |

**Recommendation: use Zoho Mail Free.** It is a real mailbox that the business owns. It is not tied to the founder's personal Gmail, which makes handover easy (section 6). It also works on Vercel DNS without moving nameservers. If you would rather live inside Gmail, or the domain is already on Cloudflare, use Cloudflare Email Routing → Gmail.

### Zoho Mail Free, step by step
1. Go to https://www.zoho.com/mail/zohomail-pricing.html and scroll to **Forever Free**. Sign up with "I already own a domain": compareempire.com.
2. Verify the domain. Zoho gives you a TXT record (`zoho-verification=zb…`). Add it at your DNS host (see below).
3. Create `hello@`. Add `deals@`, `press@` and `admin@` as **aliases** (free) rather than as extra users.
4. Add the MX records: `mx.zoho.com` (priority 10), `mx2.zoho.com` (20), `mx3.zoho.com` (50). For Australian data, Zoho may give you `mx.zoho.com.au` hosts instead. Use exactly what the setup wizard shows.
5. SPF (TXT on `@`): `v=spf1 include:zoho.com ~all` (or `include:zoho.com.au`). **There can be only one SPF record.** If you later send through Resend, Brevo and so on, merge them, for example `v=spf1 include:zoho.com include:amazonses.com ~all`.
6. DKIM: in Zoho Admin → Domains → Email configuration → DKIM, generate a selector (for example `zmail`). Add TXT `zmail._domainkey` with the long `v=DKIM1; k=rsa; p=…` value, then click Verify.
7. DMARC (TXT `_dmarc`): start with `v=DMARC1; p=none; rua=mailto:hello@compareempire.com; adkim=s; aspf=s`. After 2 to 4 weeks of clean reports, move to `p=quarantine`.
8. Test by sending to https://www.mail-tester.com and Gmail ("Show original" should say SPF/DKIM/DMARC = PASS).

### Where to add the records
- **Vercel DNS**: Vercel dashboard → Domains → compareempire.com → DNS Records → Add. For Name, use `@` for the root, `_dmarc`, or `zmail._domainkey`. Pick the type, paste the value, and set priority for MX. CLI: `vercel dns add compareempire.com @ MX mx.zoho.com 10`. https://vercel.com/docs/projects/domains/managing-dns-records
- **Cloudflare DNS**: Dashboard → the domain → DNS → Records → Add record. MX and TXT records can't be proxied, so there is no orange-cloud problem. For the Cloudflare Routing route instead: Email → Email Routing → Enable. It adds its own MX and SPF (`include:_spf.mx.cloudflare.net`). Add a destination Gmail address and a rule `hello@` → Gmail. Then in Gmail, go to Settings → Accounts → "Send mail as" → SMTP `smtp.gmail.com:587`, with the Gmail address and a Google **app password** (needs 2FA). Add `include:_spf.google.com` to the SPF. Note: mail sent through Gmail SMTP is DKIM-signed as gmail.com, not as your domain. With `p=none`, DMARC alignment still passes through SPF only partly. This is the main weakness of this route.

---

## 2. Platforms: which, in what order, and how to set them up

### Priority for Australian shoppers
1. **Instagram (Business)**: high AU reach. Reels and carousels suit "price drop" cards. Its API allows free auto-publishing.
2. **Facebook Page**: required for Instagram API publishing and Meta Business Suite. Older AU deal-hunters live in FB groups.
3. **TikTok**: the biggest discovery engine for under-35s. The "fake sale exposed" format can go viral. Auto-posting needs app approval (section 3).
4. **Threads**: free API, linked to Instagram, low effort.
5. **Bluesky**: the most automation-friendly (open API). Small but tech-literate.
6. **YouTube Shorts**: repurpose TikTok videos. Gives long-tail search, and a channel helps SEO.
7. **Reddit (personal-style account, u/compareempire)**: r/australia, r/AusFinance, r/bapcsalesaustralia, r/ozbargain-adjacent. **Never auto-post**, follow the 9:1 rule, and disclose that it's your site. OzBargain itself (https://www.ozbargain.com.au) is the real AU deal community. Read its self-promotion rules before posting anything (store reps must disclose).
8. **Pinterest**: low priority for phones. Claim the domain for free SEO.
9. **X**: low value, and the API is no longer free (section 3). Reserve the handle only.
10. **LinkedIn Page**: reserve it for credibility with retailers and partners later. It requires a personal LinkedIn profile as admin.

### Handles
- Target **@compareempire** everywhere. Check availability on every platform in one go with https://namechk.com or https://instantusername.com, then check each platform directly, because those tools can be wrong.
- Fallbacks, in order: `@compareempireau`, `@compare.empire`, `@compareempire_au`. Use the same fallback everywhere if the main handle is taken on any important platform.
- Reserve all ten in week 1, even if you leave some dormant.

### Bio templates
- Short (IG, TikTok, Threads, X; 80 to 150 chars): `Real AU phone prices, checked daily 🇦🇺 JB · Harvey Norman · Good Guys · Mobileciti. No fake sales. 👇 Today's best deals`
- Long (FB, YouTube, LinkedIn, Pinterest): `Compare Empire is an independent Australian price-comparison site. We track real daily prices for phones at JB Hi-Fi, Harvey Norman, The Good Guys and Mobileciti, keep the price history, and call out "sales" that aren't. Not owned by any retailer.`
- Bluesky: set the domain as your handle (Settings → Handle → "I have my own domain" → add the TXT record `_atproto`). You become **@compareempire.com**, which is instant verification for free. https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial
- Add affiliate disclosure if or when affiliate links are used: "We may earn a commission" (ACCC / AANA rules).

### Link in bio
Don't use Linktree. Build `compareempire.com/links` (or `/deals?utm_source=instagram`) yourself. It costs nothing, it's owned, and it adds no extra account. Use UTM tags per platform so analytics shows what works.

### Profile image specs (make one 1080×1080 master; keep the logo inside a centred circle at about 70%)
| Platform | Avatar | Cover / banner |
|---|---|---|
| Instagram | 320×320 (circle) | none |
| Facebook Page | 196×196 min (upload 720) | 1640×624 (safe area about 1200×624 on mobile) **[verify]** |
| TikTok | 200×200 min | none |
| X | 400×400 | 1500×500 |
| Threads / Bluesky | uses IG / 1000×1000 | Bluesky banner 3000×1000 |
| YouTube | 800×800 | 2560×1440 (safe 1546×423) |
| LinkedIn Page | 400×400 | 1128×191 |
| Pinterest | 165×165 shown (upload 400+) | 16:9 cover |
Post sizes: feed 1080×1350 (4:5), Reels/TikTok/Shorts 1080×1920 (9:16), OG/link 1200×630.

### Order to create (about 2 to 3 hours with Claude in Chrome)
1. Zoho mailbox `hello@` (everything else is registered with it).
2. Bitwarden vault + 2FA (section 6).
3. Facebook: you must use a personal FB profile as admin (Meta requires a real person). Create the **Page** "Compare Empire" (category: Shopping & retail / Website). Then create a **Meta Business Portfolio** (business.facebook.com) owned with hello@.
4. Instagram: sign up with hello@, switch to **Professional → Business** (not Creator, because the API needs Business or Creator and Business adds Business Suite and Shopping features), and link it to the FB Page.
5. Threads (sign in with that Instagram).
6. TikTok: sign up with hello@ and switch to **Business Account** (gives a website link in bio once eligible and the commercial music library). Note: the business account cannot use trending commercial songs.
7. YouTube: create a **Brand Account** channel (Google account on hello@, or a Google account made with that address). This keeps it transferable.
8. Bluesky (domain handle).
9. Pinterest Business (free) and claim compareempire.com (meta tag or DNS TXT).
10. Reddit, X, LinkedIn Page (reserve).

### What needs an ABN (or money) and what doesn't
- **No ABN needed**: every account above, Business/Professional account types, Meta Business Portfolio, Business Suite scheduling, API access for IG/Threads/Bluesky/Pinterest, TikTok Business account.
- **Needs payment or identity, usually business details**: Meta ads (a card; GST/ABN optional but needed for tax invoices), **Meta Verified for Business** (paid subscription, needs business verification documents) https://www.facebook.com/business/tools/meta-verified, Meta Business Verification (needs official business documents and the matching legal name), Instagram/Facebook **Shops** (needs a business and a merchant setup; not relevant to a comparison site anyway), TikTok Shop AU (needs an ABN), TikTok ads, X Verified Organizations (paid). Also, for affiliate programs, many AU networks (Commission Factory etc.) ask for an ABN, so get one (free at abr.gov.au) before monetising.

---

## 3. Automation at $0

### What each platform's API allows
| Platform | Free auto-posting? | Requirements / limits |
|---|---|---|
| **Bluesky** (AT Protocol) | **Yes, fully** | App password (Settings → App passwords). `@atproto/api` npm. Rate limits are generous (about 5,000 points/hour; a post costs 3 points) **[verify]**. Label automated accounts in the bio. https://docs.bsky.app/docs/advanced-guides/rate-limits |
| **Threads API** | **Yes** | Meta developer app + Threads use case. Long-lived token (60 days, refreshable). 250 API-published posts per 24 h. Text + image + carousel. https://developers.facebook.com/docs/threads/overview |
| **Instagram Graph API (Content Publishing)** | **Yes** | IG **Business or Creator** account linked to a **FB Page**, a Meta app with `instagram_content_publish`. For your own account only, Development/Standard access works without App Review (App Review is needed to manage others' accounts). 100 API-published posts per 24 h (was 25; **[verify]**). The image must be at a **public URL** (JPEG). https://developers.facebook.com/docs/instagram-platform/content-publishing |
| **Facebook Page** | Yes | Pages API with a Page access token (`pages_manage_posts`). |
| **TikTok Content Posting API** | Partly | Needs a registered app + **audit**. Before the audit, posts from unaudited clients are forced to **private (SELF_ONLY)**. "Upload to inbox" (draft, then a human taps publish in the app) is the realistic $0 path. https://developers.tiktok.com/doc/content-posting-api-get-started |
| **Pinterest API v5** | Yes | Trial access → Standard after review. Create Pins with an image URL and link. https://developers.pinterest.com/docs/api/v5/ |
| **X API** | **No longer free** | The free tier closed to new projects on 6 Feb 2026. Pay-per-use costs about US$0.01 to 0.015 per post, more with URLs **[verify]**. [postproxy](https://www.postproxy.dev/blog/x-api-pricing-2026/) · [medianama](https://www.medianama.com/2026/02/223-x-developer-api-pricing-pay-per-use-model/) · [opentweet](https://opentweet.io/answers/is-the-x-api-free-in-2026). Skip it, or post on X manually. |
| **YouTube Data API** | Yes (quota) | 10,000 units/day by default; an upload costs about 1,600. Unverified apps upload as **private** until the app passes an audit **[verify]**. |
| **LinkedIn** | Practically no | Posting as a Page needs the Community Management API (partner approval). Post manually. |
| **Reddit** | Don't | Technically possible, but automated self-promotion breaks subreddit rules and gets you banned. Manual only. |

### Free schedulers (for the manual or semi-manual stuff)
- **Meta Business Suite**: free, schedules FB + IG posts, Reels and Stories (Stories partly) up to 75 days ahead. https://business.facebook.com
- **Buffer Free**: 3 channels, 10 queued posts per channel (a rolling queue, not monthly), 1 user [napoleoncat](https://napoleoncat.com/blog/buffer-pricing/) · [post-bridge](https://www.post-bridge.com/blog/best-free-social-media-schedulers) **[verify]**. A good fit for TikTok + Pinterest + LinkedIn.
- **Later Free**: the free plan has been cut back and changed repeatedly. Check https://later.com/pricing **[verify]**.
- **TikTok's own scheduler** (web, Business accounts, up to 10 days ahead) and **YouTube Studio** scheduling are free.

### Proposed pipeline for this repo (build later; nothing is built yet)
```
GitHub Action  .github/workflows/social-daily.yml
  cron: "17 22 * * *"   # about 09:17 AEDT, after the daily price import
  1. checkout; read data/catalog.json (+ data/series.json for history)
  2. scripts/social/pick-deals.ts
       - top N by real % drop vs the 30/90-day median (not vs "RRP")
       - skip if the price was lower within 30 days → that is a "fake sale" candidate instead
       - dedupe against data/social/posted.json (no repeat within 7 days)
  3. render cards: https://compareempire.com/api/og/deal?id=…   (Next.js ImageResponse/satori,
       1080×1350 + 1080×1920), or render locally with satori + @resvg/resvg-js and commit
       the PNG/JPEG to a public path (IG needs a public JPEG URL)
  4. scripts/social/post.ts  → Bluesky (app password) → Threads → Instagram → FB Page
       captions from templates (section 5), + UTM links, + "#ad" if affiliate
  5. append to posted.json; on failure, open a GitHub issue (no silent failure)
  DRY_RUN=1 default for manual dispatch; a weekly job refreshes the Meta long-lived token
Secrets (GitHub → Settings → Secrets → Actions):
  BSKY_HANDLE, BSKY_APP_PASSWORD, META_APP_ID, META_APP_SECRET,
  IG_USER_ID, FB_PAGE_ID, META_PAGE_TOKEN, THREADS_USER_ID, THREADS_TOKEN
```
Repo notes:
- Cache the OG image route with long revalidation, so the bot isn't regenerating cards on every call.
- Keep price claims accurate at post time ("$1,099 at JB Hi-Fi, 22 Oct, 9am"). The ACCC is strict on misleading price claims, and stale prices are a real risk.
- Claude's role: a scheduled Claude task or `claude -p` in the Action can draft *captions*. Keep the numbers coming from data, never from the model.

### Platform terms: what to automate and what to keep manual
- **Fine to automate** (through official APIs only, on your own account): Bluesky, Threads, Instagram, FB Page, Pinterest.
- **Keep manual**: replies, DMs and comments; Reddit and OzBargain (community rules); LinkedIn; TikTok publishing (tap publish on the inbox draft); likes and follows (all platforms ban automated engagement).
- **Never** use browser bots (including Claude in Chrome) or unofficial APIs to *post* on a schedule or to follow/like. That breaks Meta's, TikTok's and X's terms and risks bans. Claude in Chrome is for one-off setup that a human supervises.
- Disclose automation where asked (Bluesky's "automated" label convention; X requires automated accounts to be labelled).

---

## 4. Claude in Chrome prompts (paste in one at a time)

> The human must do every **CAPTCHA, SMS/email code, ID check, password entry and "I agree to the terms" click**. Tell Claude to stop and hand over at each of those points. Keep the Bitwarden extension open so it generates and saves passwords, and don't paste passwords into the chat.

**A. Zoho Mail**
```
Open https://www.zoho.com/mail/zohomail-pricing.html and start the Forever Free plan sign-up for my existing domain compareempire.com. Fill name "Compare Empire", admin address hello@compareempire.com. Stop and let me handle any CAPTCHA, phone verification and password. Then go to domain verification, choose TXT method, and show me the exact record. Next, open https://vercel.com/dashboard → Domains → compareempire.com → DNS and add the TXT, the MX records Zoho lists, SPF "v=spf1 include:zoho.com ~all" (check there is no existing SPF first — if there is, merge instead), and DMARC "_dmarc" = "v=DMARC1; p=none; rua=mailto:hello@compareempire.com". Then in Zoho Admin generate DKIM selector "zmail", add it in Vercel, and click Verify. Report each record you added in a table.
```
(If the domain is on Cloudflare, swap the Vercel step for "Cloudflare dashboard → compareempire.com → DNS → Records".)

**B. Handle check**
```
Check whether the username "compareempire" is available on Instagram, TikTok, Threads, X, Bluesky, YouTube (@handle), Reddit, Pinterest and as a Facebook page username, by visiting each profile URL (e.g. instagram.com/compareempire). Don't create anything. Give me a table: platform, available yes/no/unclear, fallback suggestion from: compareempireau, compare.empire, compareempire_au.
```

**C. Facebook Page + Business Portfolio**
```
I'm logged into my personal Facebook. Create a Facebook Page named "Compare Empire", category "Shopping & retail" (secondary "Website"). Bio: "Real AU phone prices, checked daily. JB Hi-Fi · Harvey Norman · The Good Guys · Mobileciti. No fake sales." Website https://compareempire.com, email hello@compareempire.com, set username @compareempire (or the fallback I give). Skip boosts/ads and any payment screens. Then go to business.facebook.com, create a Business Portfolio "Compare Empire" with business email hello@compareempire.com, and add the Page to it. Stop for any verification step and tell me.
```

**D. Instagram**
```
Help me finish an Instagram account I've just created with hello@compareempire.com (I'll do the sign-up form, code and CAPTCHA). On instagram.com: set name "Compare Empire | AU price tracker", bio "<short bio from section 2>", link https://compareempire.com/links?utm_source=instagram. Then Settings → Account type and tools → Switch to professional → Business → category "Shopping & retail", and connect it to the Facebook Page "Compare Empire". Confirm in Meta Business Suite that both appear under the Compare Empire portfolio.
```

**E. TikTok / YouTube / Bluesky / Pinterest** (one prompt each, same pattern)
```
I'm signed in to <platform> as Compare Empire (I did verification). Fill the profile: display name "Compare Empire", bio "<bio>", website "https://compareempire.com/links?utm_source=<platform>". <TikTok: switch to Business Account, category Shopping/Retail> <YouTube: confirm this is a Brand Account channel and set handle @compareempire> <Bluesky: Settings → Handle → I have my own domain → show me the _atproto TXT value, add it in Vercel DNS, then verify> <Pinterest: convert to Business, claim website compareempire.com via the HTML tag method and tell me the tag so I can add it to the site>. Upload no images — I'll do that. Summarise what changed.
```

**F. Meta Business Suite setup**
```
Open business.facebook.com for the Compare Empire portfolio. Check Settings → Accounts shows the Page and the Instagram account. Under Users, confirm I'm admin and list any other people. Turn on two-factor requirement for everyone in Security Centre. Then open Planner and schedule this test post to both FB and IG for tomorrow 7pm AEDT: <caption>, image I'll attach. Don't spend money or create ads.
```

**G. Meta developer app** (for the pipeline)
```
Open developers.facebook.com, create an app "Compare Empire Publisher" (type Business, linked to the Compare Empire portfolio), add use cases "Manage messaging & content on Instagram" and "Access the Threads API". Generate a long-lived token for my IG Business account with instagram_basic, instagram_content_publish, pages_show_list. Don't paste tokens into chat — tell me where they're shown so I save them to Bitwarden and GitHub secrets myself.
```

---

## 5. Content

### Brand voice
- **Honest**: we show the receipts (date, store and price history). We say "this isn't a deal" as often as "this is".
- **Aussie**: dollars with GST included, AU stores and AU sale events. Light slang ("a decent drop", "not worth the hype", "ripper of a price"), but not a caricature.
- **A bit cheeky**: needle the fake "WAS $X" sales, never individuals or staff. The punchline is the data.
- **Don't**: make up prices, claim to be "the cheapest" without proof, give financial advice, or bash a retailer by name in a way you couldn't defend (stick to facts: "was $1,299 for 3 weeks before the 'sale'").
- Templates: "📉 {phone} just hit {price} at {store}, its lowest in {n} days. Was {median} most of {month}." / "🚩 'Sale' check: {phone} at {store} is {price}. It was {lower} on {date}. Not a deal."

### Content pillars
1. **Price drop of the day** (automated, daily): one card.
2. **Real price head-to-head**: iPhone vs Galaxy vs Pixel at actual AU street prices, not RRP.
3. **Fake sale exposed**: price-history chart where the "sale" price is above the 60-day low.
4. **Myth-busting / how-to**: "Is Black Friday actually cheaper?", "JB price match explained", "outright vs on a plan".
5. **AU sale calendar**: previews and live trackers for every event.
6. **Behind the data** (trust): how we collect prices, independence, and corrections.

### Cadence (sustainable solo)
- Bluesky / Threads / IG / FB: 1 automated deal card a day + 3 hand-made posts a week.
- IG Reels / TikTok / Shorts: 3 short videos a week (screen-recorded price-history charts with a voiceover; batch-film on Sundays).
- Reddit / OzBargain: answer questions when you can add value. Post your own site at most monthly, and only where allowed.
- Weekly roundup every Friday ("This week's real drops").

### AU sale calendar (check dates each year)
Boxing Day / Jan sales · Click Frenzy Mayhem (May) · EOFY sales (June, the big one in AU) · Amazon Prime Day (July) · Click Frenzy (Nov) · Black Friday / Cyber Monday (late Nov) · new-iPhone launch (Sept) · new-Galaxy launch (Jan/Feb + July foldables) · Singles' Day (11 Nov) · Christmas shipping cut-offs (mid-Dec).

### 4 weeks of post ideas (for late Oct to Nov 2026, leading into Black Friday)
| Week | Mon | Wed | Fri | Video ×3 |
|---|---|---|---|---|
| 1: launch | "Hi, we're Compare Empire" + what we track | iPhone 17 vs Galaxy S26: real AU price today | Weekly roundup | "I tracked 4 stores' phone prices every day: here's what I learned"; "How to spot a fake sale in 10s"; Drop of the week |
| 2: trust | How we collect prices (the behind-the-scenes carousel) | Myth: "RRP is the real price" | Roundup + "Best phone under $500 right now" | Fake sale exposed #1; Pixel vs iPhone base; "Do outright phones get cheaper after launch?" |
| 3: pre-Click Frenzy / Singles' Day | Click Frenzy watchlist (we'll check every "deal") | Myth: "Click Frenzy always beats normal prices" | Click Frenzy live verdicts | Live reaction to the sale; Fake sale exposed #2; "Price-match: JB vs Good Guys" |
| 4: Black Friday run-up | "Prices to screenshot NOW so you can check BF claims" | iPhone vs Galaxy BF predictions from history | BF watchlist + roundup | "Last year's BF: real or not?" (once history exists); Fake sale exposed #3; "Best deal per $100 budget" |
Every day: the automated "price drop of the day" card.

---

## 6. Making it transferable to a business later
- **Every account is registered to hello@compareempire.com** (or admin@), never a personal email. Recovery phone: a cheap prepaid SIM kept for the business, or the founder's phone, documented to change on handover.
- **Bitwarden Free** (https://bitwarden.com/pricing/): unlimited passwords, all devices, an authenticator for TOTP is a paid feature, so use **Aegis / 2FAS / Ente Auth** (free) for TOTP codes and store the recovery codes in Bitwarden notes. Later, move to a Bitwarden Organization and share a collection with a business partner or buyer.
- **2FA everywhere** (app-based, not SMS where possible). Save backup codes. Turn on "require 2FA" in the Meta Business Portfolio.
- **Meta Business Portfolio** owns the Page, the IG account, the developer app and any future ad account. Add a second admin (a trusted person) so the business isn't locked out if the founder's personal FB is. Assets can be transferred to a new company portfolio later.
- **YouTube as a Brand Account**, **Google** on hello@, **TikTok/Pinterest Business** on hello@, and **Bluesky domain handle** (you own it through DNS).
- **Domain and DNS**: registrar account on hello@ with auto-renew. When an ABN or company exists, update the registrant. Note that `.com` has no AU-presence rule; `.com.au` would need an ABN, so register it then.
- **API secrets** live only in GitHub Actions secrets and Bitwarden. Rotate them on handover.
- **Handover checklist** (keep this table updated in Bitwarden or a private doc, **not** in this public repo):

| Asset | URL | Login email | 2FA method | Recovery codes stored | Admins | Notes |
|---|---|---|---|---|---|---|
| Domain registrar | | | | | | |
| Vercel / DNS | | | | | | |
| Zoho Mail | | | | | | |
| Meta Business Portfolio (Page, IG, app) | | | | | | |
| Threads | via IG | | | | | |
| TikTok | | | | | | |
| YouTube Brand Account | | | | | | |
| Bluesky | | | | | | |
| Pinterest | | | | | | |
| Reddit / X / LinkedIn | | | | | | |
| GitHub repo + Actions secrets | | | | | | |
| Bitwarden | | | | | | |

Handover steps: add the new owner as an admin everywhere → transfer the Meta portfolio, YouTube Brand Account ownership and the GitHub repo → change the hello@ password and 2FA device → rotate all API tokens → remove the founder.

---

### Open items to verify before acting
Zoho free IMAP/POP and the domain count · ImprovMX free sending · Instagram's 100-vs-25 daily publish cap · Bluesky rate-limit points · Buffer's lifetime channel cap · Later's free plan · X pay-per-use prices · YouTube unverified-app private uploads · Facebook cover safe area.
