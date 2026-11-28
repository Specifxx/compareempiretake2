import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { ACCOUNT_AUDIENCE, ACCOUNT_ISSUER, memberEmail } from "../src/lib/member-token";

// Accounts (owner, 2026-11-28): our server trusts a member token only for "this browser owns this address", and only when the
// shared account service signed it for this site, for this use, and it has not expired.
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const other = generateKeyPairSync("ed25519");
const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload: object, key: KeyObject = privateKey, header: object = { alg: "EdDSA", kid: "sister-sign-in-1" }) {
  const head = `${enc(header)}.${enc(payload)}`;
  return `${head}.${sign(null, Buffer.from(head), key).toString("base64url")}`;
}
const now = Date.UTC(2026, 10, 28);
const good = { iss: ACCOUNT_ISSUER, aud: ACCOUNT_AUDIENCE, sub: "Member@Example.com", use: "premium-session", exp: now / 1000 + 3600 };
const keyFor = async (kid: string) => (kid === "sister-sign-in-1" ? publicKey : undefined);

test("a token the account service signed for this site names its address", async () => {
  assert.equal(await memberEmail(jwt(good), { now, keyFor }), "member@example.com");
});

test("every other token is refused", async () => {
  const bad: [string, unknown][] = [
    ["another key", jwt(good, other.privateKey)],
    ["another site", jwt({ ...good, aud: "https://scentcompare.app" })],
    ["another issuer", jwt({ ...good, iss: "https://evil.example" })],
    ["a sign-in link, not a session", jwt({ ...good, use: "sign-in" })],
    ["expired", jwt({ ...good, exp: now / 1000 - 1 })],
    ["no expiry", jwt({ ...good, exp: undefined })],
    ["unknown key id", jwt(good, privateKey, { alg: "EdDSA", kid: "nope" })],
    ["not EdDSA", jwt(good, privateKey, { alg: "none", kid: "sister-sign-in-1" })],
    ["tampered", jwt(good).replace(/\.[^.]+\./, `.${enc({ ...good, sub: "victim@example.com" })}.`)],
    ["not a string", 42],
    ["garbage", "a.b.c.d"],
  ];
  for (const [why, t] of bad) assert.equal(await memberEmail(t, { now, keyFor }), null, why);
});

test("the alert routes read the address only from a checked token, and only that address's rows", () => {
  const mine = readFileSync("src/app/api/alerts/mine/route.ts", "utf8");
  assert.match(mine, /memberEmail\(body\.token\)/);
  assert.match(mine, /WHERE email = \$\{email\} AND unsubscribed_at IS NULL/);
  assert.match(mine, /WHERE token = \$\{body\.remove\} AND email = \$\{email\}/, "a member stops only their own alert");
  const signup = readFileSync("src/app/api/alerts/route.ts", "utf8");
  assert.match(signup, /const member = body\.token \? await memberEmail\(body\.token\) : null/);
  assert.match(signup, /if \(body\.token && !member\) return json/, "a bad token never falls back to a typed address");
});

test("the account pages are never indexed and nothing names the account service's brand", () => {
  for (const p of ["src/app/account/page.tsx", "src/app/account/verify/page.tsx"]) assert.match(readFileSync(p, "utf8"), /index: false/);
  for (const p of ["SignIn", "AccountHub", "PremiumPanel", "AccountHeaderLink", "VerifyLink", "OAuthButtons"]) {
    assert.ok(!/RiftCompare/.test(readFileSync(`src/components/account/${p}.tsx`, "utf8")), `${p} names RiftCompare`);
  }
});
