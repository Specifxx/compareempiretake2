import "server-only";
import { neon } from "@neondatabase/serverless";

/**
 * The site's one small database (Neon Postgres, free tier) for things people
 * send us: feedback, reviews and price-drop alerts. Product data stays in the
 * repo as JSON; nothing here is needed to render a page.
 *
 * DATABASE_URL is set by Vercel's Neon integration (and as a GitHub secret
 * for the daily alert job). Without it, `db()` returns null and the forms say
 * they're coming soon.
 */
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

type Sql = ReturnType<typeof neon>;
let client: Sql | null = null;
let ready: Promise<void> | null = null;

export function db(): Sql | null {
  if (!url) return null;
  client ??= neon(url);
  return client;
}

export const dbConfigured = () => Boolean(url);

/** Creates the tables on first use; safe to run every cold start. */
export async function ensureSchema(): Promise<Sql | null> {
  const sql = db();
  if (!sql) return null;
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS feedback (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      kind text NOT NULL,
      message text NOT NULL,
      email text,
      page text,
      ip_hash text,
      resolved boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE TABLE IF NOT EXISTS reviews (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      name text NOT NULL,
      rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body text NOT NULL,
      email text,
      ip_hash text,
      status text NOT NULL DEFAULT 'pending'
    )`;
    await sql`CREATE TABLE IF NOT EXISTS alerts (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      email text NOT NULL,
      product text NOT NULL,
      product_name text NOT NULL,
      variant text NOT NULL,
      variant_label text,
      target numeric NOT NULL,
      price_at_signup numeric NOT NULL,
      token text NOT NULL UNIQUE,
      confirmed_at timestamptz,
      unsubscribed_at timestamptz,
      last_notified_price numeric,
      last_notified_at timestamptz,
      ip_hash text
    )`;
    await sql`CREATE INDEX IF NOT EXISTS alerts_active ON alerts (product) WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return sql;
}
