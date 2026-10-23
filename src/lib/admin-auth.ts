import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * /admin is unlisted (no links, noindex) AND password-protected: it shows
 * people's email addresses, which must not be readable by anyone who guesses
 * the URL. ADMIN_PASSWORD is a Vercel environment variable; the session
 * cookie holds an HMAC of it, so changing the password logs everyone out.
 */
export const COOKIE = "ce_admin";
const sessionValue = () => {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? createHmac("sha256", pw).update("compare-empire-admin").digest("hex") : null;
};

export function passwordMatches(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !input) return false;
  const a = Buffer.from(input), b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const sessionCookieValue = sessionValue;

export async function isAdmin(): Promise<boolean> {
  const want = sessionValue();
  const got = (await cookies()).get(COOKIE)?.value;
  return Boolean(want && got && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want)));
}
