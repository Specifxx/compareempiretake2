import { challengeResponseFor, endpointFor } from "@/lib/ebay-deletion";

/**
 * eBay Marketplace Account Deletion notifications (required for production eBay API keys).
 * eBay verifies the endpoint with GET ?challenge_code=…, expecting
 * sha256(challengeCode + verificationToken + endpointUrl) as hex. Deletion notices arrive by POST.
 * We store no eBay user data (only public listing prices and links), so a notice needs no action
 * beyond a 200. Env: EBAY_VERIFICATION_TOKEN (32–80 chars, also entered in the eBay portal).
 *
 * The endpoint URL in the hash is the one eBay called (2026-11-07): eBay marked the www URL down
 * because www now redirects to the apex before Next sees the request, and eBay never follows a
 * redirect. The portal moves to https://compareempire.com/api/ebay/account-deletion; hashing with
 * the host the challenge arrived on answers for either URL (the old endpoint env var is ignored).
 */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("challenge_code");
  const token = process.env.EBAY_VERIFICATION_TOKEN;
  if (!code || !token) return Response.json({ error: "missing challenge_code or verification token" }, { status: 400 });
  const endpoint = endpointFor(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  return Response.json({ challengeResponse: challengeResponseFor(code, token, endpoint) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  // Read and discard: there is nothing of the user's to delete.
  await req.text().catch(() => "");
  return new Response(null, { status: 200 });
}
