// How many visitor messages a function instance emails to the site inbox a day (was a count of the Neon feedback table
// until 2026-11-19). In memory only: a flood cannot spend the mail allowance, and nothing about anyone is stored.
export const INBOX_EMAILS_PER_DAY = 25;
let day = "";
let sent = 0;

/** true while this instance may still email the inbox today; counts the email it allows. */
export function takeInboxSlot(now = new Date()): boolean {
  const d = now.toISOString().slice(0, 10);
  if (d !== day) {
    day = d;
    sent = 0;
  }
  if (sent >= INBOX_EMAILS_PER_DAY) return false;
  sent++;
  return true;
}
