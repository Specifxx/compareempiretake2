import "server-only";

import { sendMail } from "./mailer";
import { CONTACT_EMAIL } from "./site";

export { emailConfigured } from "./mailer";

/** Returns false, without throwing, when email isn't set up, so a form still saves what was sent. */
export const sendEmail = (to: string, subject: string, html: string, text: string, headers?: Record<string, string>) =>
  sendMail({ to, subject, html, text, headers });

/** Tells the owner something arrived (feedback, a review to approve). */
export async function notifyOwner(subject: string, text: string): Promise<void> {
  const to = process.env.OWNER_EMAIL || CONTACT_EMAIL;
  await sendEmail(to, `[Compare Empire] ${subject}`, `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`, text);
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
