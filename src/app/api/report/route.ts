// POST /api/report: "Report a wrong price" (under every product's prices) and
// "Suggest a store" (/contact). Filed in the private reports repo shared by every
// Compare Empire site (src/lib/reports-github.ts), and, as /api/feedback does,
// emailed to the site inbox under the same daily cap (no database since
// 2026-11-19). Nothing about the visitor is kept.
import { notifyInbox } from "@/lib/email";
import { takeInboxSlot } from "@/lib/inbox-cap";
import { handleReportPost, type Report } from "@/lib/reports-github";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";

function reportMessage(r: Report): string {
  const lines =
    r.kind === "feedback"
      ? [`Feedback${r.issue ? ` (${r.issue})` : ""}${r.vote ? `: page ${r.vote === "up" ? "useful" : "not useful"}` : ""}`]
      : r.kind === "suggest-store"
      ? [`Store suggestion: ${r.store ?? "?"}${r.storeUrl ? ` (${r.storeUrl})` : ""}${r.region ? `, ${r.region}` : ""}`]
      : [`Wrong price: ${r.product ?? r.page ?? "?"}`, `Store: ${r.store ?? "not said"}${r.shown ? `, we showed ${r.shown}` : ""}${r.actual ? `, they say ${r.actual}` : ""}`, `Problem: ${r.issue ?? "not said"}`];
  return [...lines, r.note ? `Note: ${r.note}` : ""].filter(Boolean).join("\n");
}

async function alsoSave(r: Report): Promise<boolean> {
  // A "Was this page useful?" tap alone is counted by the daily triage from the reports branch, never saved or emailed here.
  if (r.kind === "feedback" && !r.note) return false;
  if (!takeInboxSlot()) return false;
  const message = reportMessage(r);
  try {
    return await notifyInbox(message.split("\n")[0]!.slice(0, 90), `${message}${r.page ? `\nPage: ${r.page}` : ""}`);
  } catch {
    return false;
  }
}

export function POST(req: Request) {
  return handleReportPost(req, "compareempire", { email: CONTACT_EMAIL, also: alsoSave });
}
