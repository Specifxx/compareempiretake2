/**
 * Sends one email through Brevo (free: 300/day) or, if only that is set,
 * Resend (free: 100/day). Plain module with no Next.js imports so the daily
 * alert script can use it too.
 *
 * EMAIL_FROM is "Name <address>" on a domain verified with the provider
 * (alerts@compareempire.com). Replies go to the business inbox. Brevo rejects
 * API calls from unlisted IPs until "Authorised IPs" blocking is turned off
 * (Security → Authorised IPs); Vercel and GitHub use changing IPs.
 */
import { CONTACT_EMAIL } from "./site";

export interface Mail { to: string; subject: string; html: string; text: string; headers?: Record<string, string> }

export const emailConfigured = () => Boolean((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && process.env.EMAIL_FROM);

function parseFrom(from: string) {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, "") || "Compare Empire", email: m[2] } : { name: "Compare Empire", email: from.trim() };
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.REPLY_TO_EMAIL || CONTACT_EMAIL;
  if (!from) return false;
  try {
    let res: Response;
    if (process.env.BREVO_API_KEY) {
      res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: parseFrom(from), to: [{ email: mail.to }], replyTo: { email: replyTo }, subject: mail.subject, htmlContent: mail.html, textContent: mail.text, headers: mail.headers }),
        signal: AbortSignal.timeout(15_000),
      });
    } else if (process.env.RESEND_API_KEY) {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: mail.to, reply_to: replyTo, subject: mail.subject, html: mail.html, text: mail.text, headers: mail.headers }),
        signal: AbortSignal.timeout(15_000),
      });
    } else return false;
    if (!res.ok) console.error(`email send failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    return res.ok;
  } catch (e) {
    console.error("email send failed:", e);
    return false;
  }
}
