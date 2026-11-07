import { createHash } from "node:crypto";

/** eBay account-deletion challenge helpers (src/app/api/ebay/account-deletion). */
export const PATH = "/api/ebay/account-deletion";
const HOSTS = new Set(["compareempire.com", "www.compareempire.com"]);

export function endpointFor(host: string | null): string {
  const h = (host ?? "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  return `https://${HOSTS.has(h) ? h : "compareempire.com"}${PATH}`;
}

export function challengeResponseFor(code: string, token: string, endpoint: string): string {
  return createHash("sha256").update(code).update(token).update(endpoint).digest("hex");
}
