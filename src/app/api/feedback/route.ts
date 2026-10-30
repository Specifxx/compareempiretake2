import { ensureSchema } from "@/lib/db";
import { notifyInbox } from "@/lib/email";
import { clip, ipHash, isEmail, json } from "@/lib/server-utils";

export const dynamic = "force-dynamic";
const KINDS = ["bug", "idea", "wrong-price", "store", "other"];
const INBOX_EMAILS_PER_DAY = 25;

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
  // Emailed to the site inbox, Reply-To the visitor (owner, 2026-10-30: "any feedback
  // feeds into the respective emails"); not to the owner's personal address, and
  // ratings and reviews still send nothing. At most INBOX_EMAILS_PER_DAY a day, so a
  // flood cannot spend the mail allowance; the rest wait in /admin. Never fails the save.
  try {
    const [{ today }] = (await sql`SELECT count(*)::int AS today FROM feedback WHERE created_at > now() - interval '1 day'`) as { today: number }[];
    if (today <= INBOX_EMAILS_PER_DAY) {
      await notifyInbox(`Feedback (${kind}): ${message.replace(/\s+/g, " ").slice(0, 80)}`, `${kind}${page ? ` · ${page}` : ""}\nFrom: ${email ?? "no email given"}\n\n${message}`, email);
    }
  } catch {
    /* the message is saved; the email is a courtesy */
  }
  return json({ ok: true });
}
