/**
 * "Weekly real deals" email signup. Posts straight to a hosted list (e.g.
 * Buttondown's embed endpoint: https://buttondown.com/api/emails/embed-subscribe/<name>)
 * set in NEXT_PUBLIC_NEWSLETTER_URL. The provider stores emails, sends the
 * confirmation and handles unsubscribes; nothing is stored here.
 * Renders nothing until the variable is set.
 */
const ACTION = process.env.NEXT_PUBLIC_NEWSLETTER_URL;

export function NewsletterSignup({ compact }: { compact?: boolean }) {
  if (!ACTION) return null;
  return (
    <form action={ACTION} method="post" target="_blank" className={`card ${compact ? "p-4" : "p-6 sm:p-8"}`}>
      <div className={compact ? "" : "max-w-xl"}>
        <div className="font-display text-lg font-bold">Get the weekly real-deals email</div>
        <p className="mt-1 text-sm text-ink-soft">
          Every Friday: the biggest genuine price drops of the week, and the &ldquo;sales&rdquo; our price history says are fake. One email, no spam, unsubscribe any time.
        </p>
      </div>
      <div className="mt-4 flex max-w-md gap-2">
        <label className="sr-only" htmlFor={compact ? "nl-email-c" : "nl-email"}>Email</label>
        <input
          id={compact ? "nl-email-c" : "nl-email"}
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand"
        />
        <input type="hidden" name="tag" value="website" />
        <button className="btn-primary shrink-0" type="submit">Subscribe</button>
      </div>
    </form>
  );
}
