/**
 * Emails price-drop alerts after the daily catalogue build. For each confirmed,
 * active alert it looks up today's best price; if that is at or under the
 * target and lower than the last price we emailed about, it sends one email.
 * Needs DATABASE_URL, BREVO_API_KEY (or RESEND_API_KEY) and EMAIL_FROM; exits quietly without them.
 */
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import type { Phone } from "../src/lib/types";
import { emailConfigured, sendMail } from "../src/lib/mailer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.compareempire.com";
const url = process.env.DATABASE_URL;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const aud = (n: number) => `$${n.toLocaleString("en-AU", { maximumFractionDigits: 2 })}`;

type Row = { id: number; email: string; product: string; product_name: string; variant: string | null; variant_label: string | null; target: number; last_notified_price: number | null; token: string };

const catalogs = new Map<string, { retailers: { id: string; name: string }[]; products: Map<string, Phone> } | null>();
function catalog(cat: string) {
  if (!catalogs.has(cat)) {
    const f = `data/${cat}/catalog.json`;
    if (!/^[a-z-]+$/.test(cat) || !existsSync(f)) catalogs.set(cat, null);
    else {
      const c = JSON.parse(readFileSync(f, "utf8"));
      catalogs.set(cat, { retailers: c.retailers, products: new Map((c.phones as Phone[]).map((p) => [p.slug, p])) });
    }
  }
  return catalogs.get(cat)!;
}

const send = (to: string, subject: string, html: string, text: string, unsub: string) =>
  sendMail({ to, subject, html, text, headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });

async function main() {
  if (!url || !emailConfigured()) { console.log("Alerts not configured; skipping."); return; }
  const sql = neon(url);
  const rows = (await sql`SELECT id, email, product, product_name, variant, variant_label, target::float8 AS target,
      last_notified_price::float8 AS last_notified_price, token
    FROM alerts WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`) as Row[];
  let sent = 0;
  for (const a of rows) {
    const [, cat, slug] = a.product.split("/");
    const c = catalog(cat);
    const p = c?.products.get(slug);
    if (!c || !p) continue;
    const v = (a.variant && p.variants.find((x) => x.id === a.variant)) || p.variants[0];
    const price = v?.bestPrice ?? p.bestPrice;
    if (!price || price > a.target) continue;
    if (a.last_notified_price != null && price >= a.last_notified_price) continue;
    const name = (id: string) => c.retailers.find((r) => r.id === id)?.name ?? id;
    const offers = [...(v?.offers ?? [])].filter((o) => o.inStock && o.kind !== "plan").sort((x, y) => x.price - y.price).slice(0, 3);
    const unsub = `${SITE}/api/alerts/unsubscribe?token=${a.token}`;
    const title = `${a.product_name}${a.variant_label ? ` (${a.variant_label})` : ""}`;
    const link = `${SITE}${a.product}`;
    const html = `<div style="font:15px/1.5 sans-serif;max-width:560px">
<h2 style="margin:0 0 8px">${esc(title)} is now ${aud(price)}</h2>
<p>That's at or under your target of ${aud(a.target)}.</p>
<ul>${offers.map((o) => `<li>${esc(name(o.retailer))}: <b>${aud(o.price)}</b> · <a href="${esc(o.url)}">view at store</a></li>`).join("")}</ul>
<p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">See price history and every store</a></p>
<p style="color:#666;font-size:12px">Prices change quickly; check the store before buying. You asked Compare Empire to email you about this product.
<a href="${unsub}">Stop this alert</a> · <a href="${unsub}&all=1">Stop all alerts</a></p></div>`;
    const text = `${title} is now ${aud(price)} (your target: ${aud(a.target)}).\n\n${offers.map((o) => `${name(o.retailer)}: ${aud(o.price)} ${o.url}`).join("\n")}\n\nPrice history: ${link}\n\nStop this alert: ${unsub}`;
    if (await send(a.email, `Price drop: ${title} is ${aud(price)}`, html, text, unsub)) {
      await sql`UPDATE alerts SET last_notified_price = ${price}, last_notified_at = now() WHERE id = ${a.id}`;
      sent++;
    }
  }
  console.log(`Checked ${rows.length} alerts, sent ${sent}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
