import { ensureSchema } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/** One click, no login: the token in the email is the proof. ?all=1 stops every alert for that address. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const t = q.get("token") ?? "";
  const sql = await ensureSchema();
  if (!sql || !t) return Response.redirect(`${SITE}/alerts?status=invalid`, 303);
  const rows =
    q.get("all") === "1"
      ? ((await sql`UPDATE alerts SET unsubscribed_at = now() WHERE email = (SELECT email FROM alerts WHERE token = ${t}) AND unsubscribed_at IS NULL RETURNING id`) as unknown[])
      : ((await sql`UPDATE alerts SET unsubscribed_at = now() WHERE token = ${t} RETURNING id`) as unknown[]);
  return Response.redirect(`${SITE}/alerts?status=${rows.length ? "unsubscribed" : "invalid"}`, 303);
}

// Mail clients' one-click unsubscribe (RFC 8058) uses POST.
export const POST = GET;
