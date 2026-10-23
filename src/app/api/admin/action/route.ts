import { COOKIE, isAdmin } from "@/lib/admin-auth";
import { ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin buttons: approve/hide/delete reviews, resolve feedback, log out. */
export async function POST(req: Request) {
  const form = await req.formData();
  const action = String(form.get("action") ?? "");
  const back = (tab: string) => new Response(null, { status: 303, headers: { location: `/admin?tab=${tab}` } });
  if (action === "logout") {
    const res = back("overview");
    res.headers.set("location", "/admin");
    res.headers.append("set-cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return res;
  }
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const sql = await ensureSchema();
  if (!sql) return back("overview");
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return back("overview");
  switch (action) {
    case "approve":
      await sql`UPDATE reviews SET status = 'approved' WHERE id = ${id}`;
      return back("reviews");
    case "hide":
      await sql`UPDATE reviews SET status = 'hidden' WHERE id = ${id}`;
      return back("reviews");
    case "delete-review":
      await sql`DELETE FROM reviews WHERE id = ${id}`;
      return back("reviews");
    case "resolve":
      await sql`UPDATE feedback SET resolved = NOT resolved WHERE id = ${id}`;
      return back("feedback");
    default:
      return back("overview");
  }
}
