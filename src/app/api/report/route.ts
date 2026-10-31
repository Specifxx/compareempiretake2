// POST /api/report: "Report a wrong price" (under every product's prices) and
// "Suggest a store" (/contact). Filed in the private reports repo shared by every
// Compare Empire site (src/lib/reports-github.ts), and, as /api/feedback does,
// saved to the feedback table (no email, no IP hash) and emailed to the site
// inbox under the same daily cap. Nothing about the visitor is kept.
import { ensureSchema } from "@/lib/db";
import { notifyInbox } from "@/lib/email";
import { handleReportPost, type Report } from "@/lib/reports-github";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";
const INBOX_EMAILS_PER_DAY = 25;

function reportMessage(r: Report): string {
  const lines =
    r.kind === "suggest-store"
      ? [`Store suggestion: ${r.store ?? "?"}${r.storeUrl ? ` (${r.storeUrl})` : ""}${r.region ? `, ${r.region}` : ""}`]
      : [`Wrong price: ${r.product ?? r.page ?? "?"}`, `Store: ${r.store ?? "not said"}${r.shown ? `, we showed ${r.shown}` : ""}${r.actual ? `, they say ${r.actual}` : ""}`, `Problem: ${r.issue ?? "not said"}`];
  return [...lines, r.note ? `Note: ${r.note}` : ""].filter(Boolean).join("\n");
}

async function alsoSave(r: Report): Promise<boolean> {
  const sql = await ensureSchema();
  if (!sql) return false;
  const kind = r.kind === "suggest-store" ? "store" : r.kind;
  const message = reportMessage(r);
  await sql`INSERT INTO feedback (kind, message, email, page, ip_hash) VALUES (${kind}, ${message}, ${null}, ${r.page}, ${null})`;
  try {
    const [{ today }] = (await sql`SELECT count(*)::int AS today FROM feedback WHERE created_at > now() - interval '1 day'`) as { today: number }[];
    if (today <= INBOX_EMAILS_PER_DAY) await notifyInbox(message.split("\n")[0]!.slice(0, 90), `${message}${r.page ? `\nPage: ${r.page}` : ""}`);
  } catch {
    /* saved; the email is a courtesy */
  }
  return true;
}

export function POST(req: Request) {
  return handleReportPost(req, "compareempire", { email: CONTACT_EMAIL, also: alsoSave });
}
