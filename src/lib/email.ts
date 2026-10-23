import "server-only";

/**
 * Sends email through Resend's HTTP API (free tier: 3,000/month). Needs
 * RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in Resend,
 * e.g. "Compare Empire <alerts@compareempire.com>"). Returns false, without
 * throwing, when email isn't set up, so a form still saves what was sent.
 */
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Tells the owner something arrived (feedback, a review to approve). */
export async function notifyOwner(subject: string, text: string): Promise<void> {
  const to = process.env.OWNER_EMAIL;
  if (!to) return;
  await sendEmail(to, `[Compare Empire] ${subject}`, `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`, text);
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
