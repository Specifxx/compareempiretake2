import { ensureSchema } from "@/lib/db";
import { emailConfigured, escapeHtml, sendEmail } from "@/lib/email";
import { clip, ipHash, isEmail, json, token } from "@/lib/server-utils";
import { SITE } from "@/lib/site";
import { money, regionOf } from "@/lib/region";

export const dynamic = "force-dynamic";

/**
 * Sign up for a price-drop alert. The alert only goes live after the person
 * clicks the link in the confirmation email (double opt-in), so nobody can
 * sign someone else up. Every email carries a one-click unsubscribe link.
 */
export async function POST(req: Request) {
  const sql = await ensureSchema();
  if (!sql) return json({ ok: false, error: "Price alerts aren't switched on yet." }, 503);
  if (!emailConfigured()) return json({ ok: false, error: "Price alerts aren't switched on yet." }, 503);
  const body = await req.json().catch(() => ({}));
  if (body.website) return json({ ok: true });
  if (!isEmail(body.email)) return json({ ok: false, error: "That email doesn't look right." }, 400);
  const email = body.email.toLowerCase();
  const product = clip(body.product, 200);
  if (!/^(\/(us|uk))?\/[a-z-]+\/[a-z0-9-]+$/.test(product)) return json({ ok: false, error: "Unknown product." }, 400);
  const productName = clip(body.productName, 160) || product;
  const alertRegion = regionOf(product);
  const variant = clip(body.variant, 60);
  const variantLabel = clip(body.variantLabel, 80) || null;
  const price = Number(body.price);
  const target = Math.round(Number(body.target) * 100) / 100;
  if (!(price > 0) || !(target > 0) || target >= price * 1.5) return json({ ok: false, error: "Pick a price to be alerted at." }, 400);
  const ip = ipHash(req);
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM alerts WHERE (ip_hash = ${ip} OR email = ${email}) AND created_at > now() - interval '1 day'`) as { n: number }[];
  if (n >= 20) return json({ ok: false, error: "That's a lot of alerts for one day — try again tomorrow." }, 429);

  // One live alert per person per product option: a new target replaces the old one.
  const existing = (await sql`SELECT token, confirmed_at FROM alerts WHERE email = ${email} AND product = ${product} AND variant = ${variant} AND unsubscribed_at IS NULL LIMIT 1`) as { token: string; confirmed_at: string | null }[];
  if (existing[0]?.confirmed_at) {
    await sql`UPDATE alerts SET target = ${target}, price_at_signup = ${price}, last_notified_price = NULL WHERE token = ${existing[0].token}`;
    return json({ ok: true, updated: true });
  }
  const t = existing[0]?.token ?? token();
  if (!existing[0]) {
    await sql`INSERT INTO alerts (email, product, product_name, variant, variant_label, target, price_at_signup, token, ip_hash)
              VALUES (${email}, ${product}, ${productName}, ${variant}, ${variantLabel}, ${target}, ${price}, ${t}, ${ip})`;
  }
  const confirm = `${SITE}/alerts?confirm=${t}`;
  const unsub = `${SITE}/api/alerts/unsubscribe?token=${t}`;
  const what = `${productName}${variantLabel ? ` (${variantLabel})` : ""}`;
  const sent = await sendEmail(
    email,
    `Confirm your price alert: ${productName}`,
    `<div style="font:15px/1.6 -apple-system,Segoe UI,sans-serif;color:#11111a;max-width:520px">
      <p>Hi! Please confirm you'd like an email when <b>${escapeHtml(what)}</b> drops to <b>${money(target, alertRegion)}</b> or less at any Australian store we check.</p>
      <p><a href="${confirm}" style="display:inline-block;background:#5B3DF5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Confirm my alert</a></p>
      <p style="color:#707084;font-size:13px">Didn't ask for this? Ignore this email and nothing happens. <a href="${unsub}" style="color:#707084">Never email me</a>.</p>
      <p style="color:#707084;font-size:13px">Compare Empire · compareempire.com</p></div>`,
    `Confirm your Compare Empire price alert for ${what} at ${money(target, alertRegion)}: ${confirm}\n\nDidn't ask for this? Ignore this email. Unsubscribe: ${unsub}`,
  );
  if (!sent) return json({ ok: false, error: "We couldn't send the confirmation email. Please try again later." }, 502);
  return json({ ok: true, confirm: true });
}
