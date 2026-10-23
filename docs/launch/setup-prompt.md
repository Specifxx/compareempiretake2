# Compare Empire services setup (Claude in Chrome)

Paste the prompt below into Claude in Chrome. It is safe to run again and again:
it checks each step first and skips whatever is already done.

```
You are setting up the free services behind https://www.compareempire.com.
Every account must use the business email compareempire@outlook.com (never a personal email).

How to work:
- Do the tasks in order. Before each task, CHECK whether it is already done (log in, look at the setting). If it is done, write "already done" and move on.
- Fill in every field you can. When a step needs me (password, CAPTCHA, phone or email code, payment screen, "I'm not a robot", approving a login), STOP that task, leave its tab open on that exact screen, tell me in one line what I need to do there, and go on to the next task in a NEW tab.
- Never enter payment details or choose a paid plan. Always choose the free plan.
- Never paste secret keys into chat with me except where a task says to copy a value into Vercel or GitHub.
- At the end, print a table: task, status (done / already done / waiting on me / failed), and what I need to do.

TASK 1. Outlook inbox
Open https://outlook.live.com and check I'm signed in as compareempire@outlook.com. If not, open the sign-in page with that address filled in and leave it for me. Keep this tab open: later tasks send verification emails here. When a task says "check the inbox", come back to this tab, open the newest email from that service and click its verify/confirm link.

TASK 2. Brevo (sends price alerts and site emails, free 300/day)
a. Go to https://app.brevo.com. If not signed in, sign up at https://onboarding.brevo.com/account/register with compareempire@outlook.com. Company: Compare Empire, website https://www.compareempire.com, country Australia. I set the password. Choose the Free plan. Check the inbox for the confirmation email.
b. Turn OFF IP blocking (otherwise every email from the website is refused): Profile menu → Security → Authorised IPs → "Deactivate blocking" (or the toggle that allows all IP addresses). Confirm the page says unknown IPs are allowed.
c. Authenticate the domain: Senders, Domains & Dedicated IPs → Domains → Add a domain → compareempire.com. Choose to add the DNS records manually. Copy every record it lists (type, host/name, value).
d. In a new tab open https://vercel.com → Domains → compareempire.com (or the project's Settings → Domains → compareempire.com → DNS records). Add each Brevo record exactly. If a TXT record named "@" starting with "v=spf1" already exists, edit it to add "include:spf.brevo.com" before "~all" instead of adding a second SPF record. If a "_dmarc" record already exists, leave it; otherwise add TXT _dmarc = v=DMARC1; p=none; rua=mailto:compareempire@outlook.com
e. Back in Brevo, click Authenticate / Verify. DNS can take up to an hour; if it isn't verified yet, mark "waiting on DNS" and continue (re-running this prompt later will finish it).
f. Senders → Add a sender: name "Compare Empire", email alerts@compareempire.com.
g. SMTP & API → API keys → Generate a new API key named "compareempire-site". Copy it for tasks 4 and 5. (If one named compareempire-site already exists and you can't see its value, make a new one named compareempire-site-2.)

TASK 3. Database (Neon through Vercel, free)
Open https://vercel.com → project compareempiretake2 → Storage. If a Neon (Postgres) database is already connected, skip. Otherwise Create Database → Neon → free plan → region Sydney (syd1) if offered → connect to Production, Preview and Development. Then Settings → Environment Variables and copy the value of DATABASE_URL for task 5.

TASK 4. Vercel environment variables (Production)
In compareempiretake2 → Settings → Environment Variables, make sure these exist (edit if wrong, skip if right):
- BREVO_API_KEY = the key from task 2g
- EMAIL_FROM = Compare Empire <alerts@compareempire.com>
- OWNER_EMAIL = compareempire@outlook.com
- REPLY_TO_EMAIL = compareempire@outlook.com
- ADMIN_PASSWORD = STOP and ask me to type a long password myself (at least 16 characters). Do not invent it.
Then Deployments → the latest Production deployment → ⋯ → Redeploy. Wait for Ready.

TASK 5. GitHub secrets (the daily job that emails price alerts)
Open https://github.com/specifxx/compareempiretake2/settings/secrets/actions. Add or update repository secrets:
- DATABASE_URL = value from task 3
- BREVO_API_KEY = key from task 2g
- EMAIL_FROM = Compare Empire <alerts@compareempire.com>

TASK 6. Check the site
a. Open https://www.compareempire.com/admin. It should show a password box (I log in myself).
b. Open https://www.compareempire.com/contact and confirm it shows compareempire@outlook.com.
c. Open any phone page, click "Alert me when it drops", enter compareempire@outlook.com and submit. Check the inbox for "Confirm your price alert", open it and press the confirm button. If the email didn't arrive within 3 minutes, check Junk, then report the error the form showed.
d. Click the Feedback button, send "Setup test, please ignore", and confirm a "[Compare Empire] New feedback" email arrives in the inbox.

TASK 7. Google Search Console (use a Google account on compareempire@outlook.com)
If I don't have one, open https://accounts.google.com/signup and choose "Use your existing email" with compareempire@outlook.com; stop for me at the code/phone step. Then https://search.google.com/search-console → Add property → URL prefix https://www.compareempire.com → HTML tag method → copy only the content="..." value → in Vercel add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = that value (Production) → redeploy → Verify. Submit sitemap.xml. Request indexing for /, /deals, /phones, /tvs.

TASK 8. Bing Webmaster Tools (the Outlook address is already a Microsoft account)
https://www.bing.com/webmasters → sign in with compareempire@outlook.com → Import from Google Search Console if verified, otherwise add the site, use the meta tag method, add NEXT_PUBLIC_BING_SITE_VERIFICATION in Vercel, redeploy, verify. Submit https://www.compareempire.com/sitemap.xml.

TASK 9. Weekly deals newsletter (Buttondown, free)
https://buttondown.com → sign up with compareempire@outlook.com, username compareempire. Name "Compare Empire Real Deals Weekly", description "The week's genuine price drops and the fake sales, every Friday." Turn ON double opt-in. Copy the embed form action URL (https://buttondown.com/api/emails/embed-subscribe/compareempire) into Vercel as NEXT_PUBLIC_NEWSLETTER_URL (Production) and redeploy.

TASK 10. Downtime alerts (UptimeRobot, free)
https://uptimerobot.com → sign up with compareempire@outlook.com → add HTTPS monitors (5-minute interval) for https://www.compareempire.com and https://www.compareempire.com/api/reviews , alert contact compareempire@outlook.com.

TASK 11. Notifications to the business inbox
a. Vercel → Account Settings → Emails: add compareempire@outlook.com as an extra email if allowed (don't change the login). Notifications: turn on failed-deployment emails.
b. GitHub → Settings → Emails: add compareempire@outlook.com (don't make it primary unless I say). Check the inbox to verify it.

Finish with the status table. Next time I run this prompt, pick up anything still "waiting on me" or "waiting on DNS".
```
