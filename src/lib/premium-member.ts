// COMPARE EMPIRE ACCOUNTS AND PREMIUM (owner, 2026-11-28: "stores like Compare Empire should also have login … all the features that
// users have"), the same shared account the other price comparison sites use. This site holds ONE thing for a member: a token the
// account service signed for compareempire.com, kept in this browser (localStorage) and sent to the service's /api/sister-premium/* to
// ask what it is worth (it re-reads the account every time, so nothing about a membership is copied here). Our own server checks the
// same token against the service's public key for the member's price alerts (lib/member-token.ts, /api/alerts/mine), which stay in
// Compare Empire's own table. The visitor never leaves this site to sign in by email; nothing names another site. DECISIONS.md, 2026-11-28.
export const PREMIUM_SERVICE = "https://riftcompare.com";
/** Compare Empire's own Google sign-in client, if it ever gets one (public by design). Empty: Google goes through OAuthButtons. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_CE_GOOGLE_CLIENT_ID || "";
export const PREMIUM_SIGN_IN = "/account";
export const PREMIUM_STORE_KEY = "ce_premium_v1";
/** How long a cached "is a member" answer is trusted before the browser asks again. */
export const PREMIUM_RECHECK_MS = 60 * 60 * 1000;
export const PREMIUM_PRICE_LINE = "US$4.99 a month or US$39.99 a year, 14 days free (card needed), cancel any time";

export interface StoredPremium {
  t: string;
  premium: boolean;
  until: string | null;
  who: string;
  checkedAt: number;
}

/** The token in a `#t=<token>` fragment, or null. Tokens are three base64url parts. */
export function tokenFromHash(hash: string): string | null {
  const m = /^#?(?:.*&)?t=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?:&.*)?$/.exec(hash || "");
  return m && m[1].length < 4096 ? m[1] : null;
}

export function readStored(): StoredPremium | null {
  try {
    const v = JSON.parse(localStorage.getItem(PREMIUM_STORE_KEY) || "null") as Partial<StoredPremium> | null;
    if (!v || typeof v.t !== "string" || !v.t) return null;
    return { t: v.t, premium: v.premium === true, until: typeof v.until === "string" ? v.until : null, who: typeof v.who === "string" ? v.who : "", checkedAt: Number(v.checkedAt) || 0 };
  } catch {
    return null;
  }
}

export function writeStored(v: StoredPremium | null): void {
  try {
    if (v) localStorage.setItem(PREMIUM_STORE_KEY, JSON.stringify(v));
    else localStorage.removeItem(PREMIUM_STORE_KEY);
  } catch {
    /* private window: the member simply signs in again */
  }
}

export type CheckResult = { kind: "ok"; premium: boolean; until: string | null; who: string } | { kind: "invalid" } | { kind: "error" };

/** Ask RiftCompare what this token is worth right now. "invalid" = sign in again; "error" = could not tell (keep what we had). */
export async function checkToken(token: string): Promise<CheckResult> {
  try {
    const r = await fetch(`${PREMIUM_SERVICE}/api/sister-premium/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "omit",
    });
    if (r.status === 401) return { kind: "invalid" };
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; premium?: boolean; until?: string | null; who?: string };
    return r.ok && j.ok ? { kind: "ok", premium: j.premium === true, until: j.until ?? null, who: j.who ?? "" } : { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}

/** Re-check (when the cache is stale or `force`), store the answer, and return what to show. */
export async function refreshPremium(force = false): Promise<StoredPremium | null> {
  const cur = readStored();
  if (!cur) return null;
  if (!force && Date.now() - cur.checkedAt < PREMIUM_RECHECK_MS) return cur;
  const res = await checkToken(cur.t);
  if (res.kind === "invalid") {
    writeStored(null);
    return null;
  }
  if (res.kind === "error") return cur;
  const next = { t: cur.t, premium: res.premium, until: res.until, who: res.who, checkedAt: Date.now() };
  writeStored(next);
  return next;
}

export interface MyAlert {
  id: string;
  path: string;
  name: string;
  option: string | null;
  target: number;
  price: number;
  live: boolean;
  lastSent: string | null;
}

export type MyAlertsResult = { kind: "ok"; alerts: MyAlert[] } | { kind: "invalid" } | { kind: "error" };

/** The member's own price alerts, from our own server (it checks the token itself); `remove` stops one first. */
export async function loadMyAlerts(token: string, remove?: string): Promise<MyAlertsResult> {
  try {
    const r = await fetch("/api/alerts/mine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...(remove ? { remove } : {}) }) });
    if (r.status === 401) return { kind: "invalid" };
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; alerts?: MyAlert[] };
    return r.ok && j.ok && Array.isArray(j.alerts) ? { kind: "ok", alerts: j.alerts } : { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}

export function untilLine(until: string | null): string {
  if (!until) return "";
  const d = new Date(until);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type ApiAnswer = { ok?: boolean; error?: string; token?: string; premium?: boolean; until?: string | null; who?: string; url?: string; sent?: boolean };

async function premiumApi(path: string, body: unknown): Promise<{ status: number; j: ApiAnswer }> {
  try {
    const r = await fetch(`${PREMIUM_SERVICE}/api/sister-premium/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
    });
    return { status: r.status, j: ((await r.json().catch(() => ({}))) as ApiAnswer) || {} };
  } catch {
    return { status: 0, j: { error: "Couldn't reach the server. Check your connection and try again." } };
  }
}

export type SignInResult = { ok: true; info: StoredPremium } | { ok: false; message: string };

function keep(j: ApiAnswer): SignInResult {
  if (!j.token) return { ok: false, message: j.error || "Sign-in failed. Try again." };
  const info: StoredPremium = { t: j.token, premium: j.premium === true, until: j.until ?? null, who: j.who ?? "", checkedAt: Date.now() };
  writeStored(info);
  return { ok: true, info };
}

/** "Continue with Google": Google's ID token (from Google Identity Services on this page) for a Compare Empire sign-in. */
export async function signInWithGoogle(credential: string): Promise<SignInResult> {
  const { j } = await premiumApi("sign-in", { method: "google", credential });
  return keep(j);
}

/** Email a 20-minute sign-in link (from our alert sender) that lands on /account/verify. */
export async function emailSignInLink(email: string): Promise<{ ok: boolean; message: string }> {
  const { j } = await premiumApi("sign-in", { method: "email", email });
  return j.ok && j.sent ? { ok: true, message: `Check ${email} for your sign-in link (it works for 20 minutes).` } : { ok: false, message: j.error || "Couldn't send the email. Try again." };
}

/** The code from an emailed link's `#c=` fragment. */
export function codeFromHash(hash: string): string | null {
  const m = /^#?(?:.*&)?c=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?:&.*)?$/.exec(hash || "");
  return m && m[1].length < 4096 ? m[1] : null;
}

export async function signInWithCode(code: string): Promise<SignInResult> {
  const { j } = await premiumApi("sign-in", { method: "link", code });
  return keep(j);
}

/** Open Stripe Checkout for the signed-in member (14 days free, card needed). Returns the URL to go to, or a message. */
export async function startCheckout(token: string, plan: "monthly" | "annual"): Promise<{ url: string } | { message: string; signIn?: boolean }> {
  const { status, j } = await premiumApi("checkout", { token, plan });
  if (j.url) return { url: j.url };
  if (status === 401) {
    writeStored(null);
    return { message: "Please sign in again.", signIn: true };
  }
  return { message: j.error || "Couldn't open checkout. Try again." };
}

/** Stripe's billing portal for the member (change plan, card, cancel). */
export async function openBilling(token: string): Promise<{ url: string } | { message: string }> {
  const { j } = await premiumApi("portal", { token });
  return j.url ? { url: j.url } : { message: j.error || "Couldn't open billing. Try again." };
}

// AD-FREE FOR MEMBERS (owner, 2026-11-16: Premium needed real value). A member's browser sets data-adfree on <html> before first paint, from the
// membership it cached (the hourly re-check in AdFreeSync corrects it), and globals.css hides the banner ads and the phone dock under it.
// Price tables, stores, their order and the paid rows inside them are untouched: this removes banners, nothing else, and the one CDN copy
// of every page stays the same for everyone.
export const ADFREE_BOOT_SCRIPT = `try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(PREMIUM_STORE_KEY)})||"null");if(v&&v.premium===true)document.documentElement.setAttribute("data-adfree","")}catch(e){}`;

/** Funnel events (GA4, best-effort, consent-respecting): premium_corner_click, premium_view, premium_trial_click, premium_signin_redirect, premium_checkout_open. */
export function trackPremium(event: string, params: Record<string, unknown> = {}): void {
  try {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", event, params);
  } catch {
    /* analytics is best-effort */
  }
}
