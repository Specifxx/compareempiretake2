import { createPublicKey, verify, type JsonWebKey, type KeyObject } from "node:crypto";

// A SIGNED-IN MEMBER, CHECKED ON OUR OWN SERVER (owner, 2026-11-28: "stores like Compare Empire should also have login … all the
// features that users have"). The shared account service signs a member a token for compareempire.com (EdDSA, `use:
// "premium-session"`, audience this site); the browser keeps it (lib/premium-member.ts) and sends it with a request. This file checks
// the signature against the service's PUBLIC key (its JWKS) and reads the address: the only thing it trusts it for is "this browser
// proved it owns this address". Nothing is stored from it, and no secret is held here. DECISIONS.md, 2026-11-28.
// (No "server-only" import: it holds no secret, and tests/member-token.test.ts imports it.)
export const ACCOUNT_ISSUER = "https://riftcompare.com";
export const ACCOUNT_AUDIENCE = "https://compareempire.com";
const JWKS_URL = `${ACCOUNT_ISSUER}/api/sister-sign-in/jwks`;
const KEYS_TTL_MS = 60 * 60 * 1000;

let cache: { at: number; keys: Map<string, KeyObject> } | null = null;

async function keys(fetcher: typeof fetch): Promise<Map<string, KeyObject>> {
  if (cache && Date.now() - cache.at < KEYS_TTL_MS) return cache.keys;
  const r = await fetcher(JWKS_URL, { cache: "no-store" });
  if (!r.ok) throw new Error(`jwks ${r.status}`);
  const j = (await r.json()) as { keys?: (JsonWebKey & { kid?: string })[] };
  const m = new Map<string, KeyObject>();
  for (const k of j.keys ?? []) if (k.kty === "OKP" && k.crv === "Ed25519" && k.kid) m.set(k.kid, createPublicKey({ key: k, format: "jwk" }));
  cache = { at: Date.now(), keys: m };
  return m;
}

const b64 = (s: string) => Buffer.from(s, "base64url");

/** The address a valid member token names, or null (bad shape, wrong signature, issuer, audience or use, or expired). Pure but for the key fetch. */
export async function memberEmail(token: unknown, opts: { now?: number; fetcher?: typeof fetch; keyFor?: (kid: string) => Promise<KeyObject | undefined> } = {}): Promise<string | null> {
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(b64(parts[0]!).toString("utf8")) as { alg?: string; kid?: string };
    if (header.alg !== "EdDSA" || typeof header.kid !== "string") return null;
    const key = opts.keyFor ? await opts.keyFor(header.kid) : (await keys(opts.fetcher ?? fetch)).get(header.kid);
    if (!key) return null;
    if (!verify(null, Buffer.from(`${parts[0]}.${parts[1]}`), key, b64(parts[2]!))) return null;
    const p = JSON.parse(b64(parts[1]!).toString("utf8")) as { iss?: string; aud?: string | string[]; sub?: string; use?: string; exp?: number };
    const now = Math.floor((opts.now ?? Date.now()) / 1000);
    const aud = Array.isArray(p.aud) ? p.aud : [p.aud];
    if (p.iss !== ACCOUNT_ISSUER || !aud.includes(ACCOUNT_AUDIENCE) || p.use !== "premium-session") return null;
    if (typeof p.exp !== "number" || p.exp < now) return null;
    const email = typeof p.sub === "string" ? p.sub.trim().toLowerCase() : "";
    return email.length >= 3 && email.length <= 254 && email.includes("@") ? email : null;
  } catch {
    return null;
  }
}
