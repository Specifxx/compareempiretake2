import "server-only";

import { sendMail } from "./mailer";
import { CONTACT_EMAIL } from "./site";

export { emailConfigured } from "./mailer";

/** Returns false, without throwing, when email isn't set up, so a form still saves what was sent. */
export const sendEmail = (to: string, subject: string, html: string, text: string, headers?: Record<string, string>) =>
  sendMail({ to, subject, html, text, headers });

/**
 * Tells the owner something arrived (feedback, a review to approve). Always CONTACT_EMAIL (owner, 2026-11-08: everything
 * Compare Empire goes to the Gmail inbox); the old OWNER_EMAIL variable still names the retired Outlook address in Vercel.
 */
export async function notifyOwner(subject: string, text: string): Promise<void> {
  const to = CONTACT_EMAIL;
  await sendEmail(to, `[Compare Empire] ${subject}`, `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`, text);
}

/**
 * A visitor's message, to the site's own inbox (CONTACT_EMAIL, compareempire@gmail.com;
 * the old INBOX_EMAIL variable is no longer read), Reply-To the visitor when they left an address (owner,
 * 2026-10-30: "any feedback feeds into the respective emails").
 */
export async function notifyInbox(subject: string, text: string, replyTo?: string | null): Promise<void> {
  const to = CONTACT_EMAIL;
  await sendMail({ to, subject: `[Compare Empire] ${subject}`, html: `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`, text, ...(replyTo ? { replyTo } : {}) });
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
