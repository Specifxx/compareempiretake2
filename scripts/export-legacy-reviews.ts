/**
 * Writes Compare Empire's own approved reviews (sent before 2026-11-03, when reviews moved to RiftCompare's shared
 * service) to data/reviews/legacy.json, so the site shows them without reading the database (DECISIONS.md 2026-11-19).
 * Runs in refresh-prices.yml right before the data commit, next to the daily alert check, so it adds no extra database
 * wake. Without DATABASE_URL, or when the database does not answer, it leaves the file as it is and exits 0.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "data/reviews/legacy.json";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log("DATABASE_URL not set; keeping the file."); return; }
  const sql = neon(url);
  const reviews = (await sql`SELECT id, name, rating, body, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 60`) as {
    id: number; name: string; rating: number; body: string; created_at: string | Date;
  }[];
  const [agg] = (await sql`SELECT count(*)::int AS count, round(avg(rating)::numeric, 1)::float AS average FROM reviews WHERE status = 'approved'`) as { count: number; average: number | null }[];
  const next = {
    reviews: reviews.map((r) => ({ id: r.id, name: r.name, rating: r.rating, body: r.body, created_at: new Date(r.created_at).toISOString() })),
    count: agg?.count ?? 0,
    average: agg?.average ?? null,
  };
  const prev = JSON.parse(readFileSync(FILE, "utf8"));
  if (JSON.stringify({ reviews: prev.reviews, count: prev.count, average: prev.average }) === JSON.stringify(next)) {
    console.log(`Unchanged: ${next.count} approved reviews.`);
    return;
  }
  writeFileSync(FILE, JSON.stringify({ exportedAt: new Date().toISOString(), ...next }, null, 1) + "\n");
  console.log(`Wrote ${next.count} approved reviews.`);
}

main().catch((e) => {
  console.log(`Database not readable (${(e as Error).message.slice(0, 120)}); keeping the file.`);
});
