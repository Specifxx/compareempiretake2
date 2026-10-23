import { ensureSchema } from "@/lib/db";
import { json } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

/**
 * Confirms an alert. POST only, from the button on /alerts: email security
 * scanners open every link in an email, and a GET here would let them
 * "confirm" alerts nobody asked for.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const t = typeof body.token === "string" ? body.token : "";
  const sql = await ensureSchema();
  if (!sql || !t) return json({ ok: false }, 400);
  const rows = (await sql`UPDATE alerts SET confirmed_at = coalesce(confirmed_at, now()), unsubscribed_at = NULL WHERE token = ${t} RETURNING product, product_name, target`) as {
    product: string;
    product_name: string;
    target: string;
  }[];
  return rows[0] ? json({ ok: true, product: rows[0].product, name: rows[0].product_name, target: Number(rows[0].target) }) : json({ ok: false }, 404);
}
