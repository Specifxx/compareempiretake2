import { notifyOwner } from "@/lib/email";
import { ensureSchema } from "@/lib/db";
import { clip, ipHash, isEmail, json } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export interface PublicReview {
  id: number;
  name: string;
  rating: number;
  body: string;
  created_at: string;
}

/** Approved reviews, newest first, plus the average across all of them. */
export async function GET() {
  const sql = await ensureSchema();
  if (!sql) return json({ enabled: false, reviews: [], count: 0, average: null });
  const reviews = (await sql`SELECT id, name, rating, body, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 60`) as PublicReview[];
  const [agg] = (await sql`SELECT count(*)::int AS count, round(avg(rating)::numeric, 1)::float AS average FROM reviews WHERE status = 'approved'`) as { count: number; average: number | null }[];
  return Response.json(
    { enabled: true, reviews, count: agg.count, average: agg.average },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}

export async function POST(req: Request) {
  const sql = await ensureSchema();
  if (!sql) return json({ ok: false, error: "Reviews aren't switched on yet." }, 503);
  const body = await req.json().catch(() => ({}));
  if (body.website) return json({ ok: true });
  const name = clip(body.name, 60) || "Anonymous";
  const text = clip(body.body, 2000);
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 5)) return json({ ok: false, error: "Pick a star rating." }, 400);
  if (text.length < 10) return json({ ok: false, error: "Tell us a bit more (10+ characters)." }, 400);
  const email = isEmail(body.email) ? body.email.toLowerCase() : null;
  const ip = ipHash(req);
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM reviews WHERE ip_hash = ${ip} AND created_at > now() - interval '1 day'`) as { n: number }[];
  if (n >= 3) return json({ ok: false, error: "You've already left a review today — thank you!" }, 429);
  await sql`INSERT INTO reviews (name, rating, body, email, ip_hash) VALUES (${name}, ${rating}, ${text}, ${email}, ${ip})`;
  await notifyOwner(`New review to approve (${rating}★)`, `${name}: ${text}`);
  return json({ ok: true });
}
