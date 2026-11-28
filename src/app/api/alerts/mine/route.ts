import { ensureSchema } from "@/lib/db";
import { json } from "@/lib/server-utils";
import { memberEmail } from "@/lib/member-token";

export const dynamic = "force-dynamic";

/**
 * A signed-in member's own price alerts (the account page): POST { token, remove? }. The token proves the address
 * (lib/member-token.ts); only that address's rows are read or stopped. Never cached, nothing about anyone else.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown; remove?: unknown };
  const email = await memberEmail(body.token);
  if (!email) return json({ ok: false, error: "Please sign in again." }, 401);
  const sql = await ensureSchema();
  if (!sql) return json({ ok: true, alerts: [] });
  if (typeof body.remove === "string" && body.remove.length <= 64) {
    await sql`UPDATE alerts SET unsubscribed_at = now() WHERE token = ${body.remove} AND email = ${email} AND unsubscribed_at IS NULL`;
  }
  const rows = (await sql`SELECT token, product, product_name, variant_label, target, price_at_signup, confirmed_at, last_notified_at
                          FROM alerts WHERE email = ${email} AND unsubscribed_at IS NULL ORDER BY created_at DESC LIMIT 100`) as {
    token: string;
    product: string;
    product_name: string;
    variant_label: string | null;
    target: string;
    price_at_signup: string;
    confirmed_at: string | null;
    last_notified_at: string | null;
  }[];
  return json({
    ok: true,
    alerts: rows.map((r) => ({
      id: r.token,
      path: r.product,
      name: r.product_name,
      option: r.variant_label,
      target: Number(r.target),
      price: Number(r.price_at_signup),
      live: !!r.confirmed_at,
      lastSent: r.last_notified_at,
    })),
  });
}
