import { createHash } from "node:crypto";

/**
 * eBay Marketplace Account Deletion notifications (required for production eBay API keys).
 * eBay verifies the endpoint with GET ?challenge_code=…, expecting
 * sha256(challengeCode + verificationToken + endpointUrl) as hex. Deletion notices arrive by POST.
 * We store no eBay user data (only public listing prices and links), so a notice needs no action
 * beyond a 200. Env: EBAY_VERIFICATION_TOKEN (32–80 chars, also entered in the eBay portal) and
 * optionally EBAY_DELETION_ENDPOINT (defaults to the production URL below).
 */
export const dynamic = "force-dynamic";

const ENDPOINT = process.env.EBAY_DELETION_ENDPOINT || "https://www.compareempire.com/api/ebay/account-deletion";

export function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("challenge_code");
  const token = process.env.EBAY_VERIFICATION_TOKEN;
  if (!code || !token) return Response.json({ error: "missing challenge_code or verification token" }, { status: 400 });
  const challengeResponse = createHash("sha256").update(code).update(token).update(ENDPOINT).digest("hex");
  return Response.json({ challengeResponse }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  // Read and discard: there is nothing of the user's to delete.
  await req.text().catch(() => "");
  return new Response(null, { status: 200 });
}
