import { COOKIE, passwordMatches, sessionCookieValue } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const ok = passwordMatches(String(form.get("password") ?? ""));
  // A small fixed delay makes guessing slow.
  await new Promise((r) => setTimeout(r, 600));
  const res = new Response(null, { status: 303, headers: { location: ok ? "/admin" : "/admin?error=1" } });
  if (ok) res.headers.append("set-cookie", `${COOKIE}=${sessionCookieValue()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 14}`);
  return res;
}
