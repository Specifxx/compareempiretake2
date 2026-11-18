import { notifyInbox } from "@/lib/email";
import { takeInboxSlot } from "@/lib/inbox-cap";
import { clip, isEmail, json } from "@/lib/server-utils";
import { cleanReport, overLimit, saveReport } from "@/lib/reports-github";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";
const KINDS = ["bug", "idea", "wrong-price", "store", "other"];

// No database since 2026-11-19 (DECISIONS.md): a message goes to the site's reports branch, which the daily triage reads
// (lib/reports-github.ts: no email, no IP, contact details blanked in the text), and to the site inbox, Reply-To the visitor
// (owner, 2026-10-30: "any feedback feeds into the respective emails"). Delivered when either one took it.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return json({ ok: true }); // honeypot: bots fill every field
  const message = clip(body.message, 4000);
  if (message.length < 3) return json({ ok: false, error: "Please write a little more." }, 400);
  const kind = KINDS.includes(body.kind) ? body.kind : "other";
  const email = isEmail(body.email) ? body.email.toLowerCase() : null;
  const page = clip(body.page, 300) || null;
  const xff = req.headers.get("x-forwarded-for");
  if (overLimit((xff ? xff.split(",")[0]!.trim() : req.headers.get("x-real-ip")) || "unknown")) {
    return json({ ok: false, error: "That's a lot of feedback — please try again in a bit." }, 429);
  }
  const r =
    kind === "wrong-price" || kind === "store"
      ? cleanReport({ kind: "other", issue: kind, note: message, page }, "compareempire")
      : cleanReport({ kind: "feedback", issue: kind, note: message, page }, "compareempire");
  const saved = r.ok ? await saveReport(r.report) : "failed";
  let emailed = false;
  if (takeInboxSlot()) {
    try {
      emailed = await notifyInbox(`Feedback (${kind}): ${message.replace(/\s+/g, " ").slice(0, 80)}`, `${kind}${page ? ` · ${page}` : ""}\nFrom: ${email ?? "no email given"}\n\n${message}`, email);
    } catch {
      /* the report branch has it */
    }
  }
  if (saved === "saved" || emailed) return json({ ok: true });
  return json({ ok: false, error: `Couldn't send that right now. Please email ${CONTACT_EMAIL} instead.` }, 502);
}
