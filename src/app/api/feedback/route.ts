import { notifyOwner } from "@/lib/email";
import { ensureSchema } from "@/lib/db";
import { clip, ipHash, isEmail, json } from "@/lib/server-utils";

export const dynamic = "force-dynamic";
const KINDS = ["bug", "idea", "wrong-price", "store", "other"];

export async function POST(req: Request) {
  const sql = await ensureSchema();
  if (!sql) return json({ ok: false, error: "Feedback isn't switched on yet." }, 503);
  const body = await req.json().catch(() => ({}));
  if (body.website) return json({ ok: true }); // honeypot: bots fill every field
  const message = clip(body.message, 4000);
  if (message.length < 3) return json({ ok: false, error: "Please write a little more." }, 400);
  const kind = KINDS.includes(body.kind) ? body.kind : "other";
  const email = isEmail(body.email) ? body.email.toLowerCase() : null;
  const page = clip(body.page, 300) || null;
  const ip = ipHash(req);
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM feedback WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`) as { n: number }[];
  if (n >= 10) return json({ ok: false, error: "That's a lot of feedback — please try again in a bit." }, 429);
  await sql`INSERT INTO feedback (kind, message, email, page, ip_hash) VALUES (${kind}, ${message}, ${email}, ${page}, ${ip})`;
  await notifyOwner(`New feedback (${kind})`, `${message}\n\nFrom: ${email ?? "anonymous"}\nPage: ${page ?? "-"}`);
  return json({ ok: true });
}
