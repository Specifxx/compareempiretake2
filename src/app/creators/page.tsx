import type { Metadata } from "next";
import Link from "next/link";
import { CoffeeIcon, CreatorCard } from "@/components/creators/CreatorCard";
import { featuredCreators } from "@/lib/creators";
import { CONTACT_EMAIL, SITE, SITE_NAME } from "@/lib/site";

// /creators: the creators hub, RiftCompare's /creators brought over (owner, 2026-11-03: "a really nice formatted creators page,
// just like how RiftCompare does it", on every site). Two audiences: shoppers finding creators to follow and tip, and creators
// deciding whether a listing is worth a mention in their content. The list is static (src/lib/creators.ts), so the page is
// prerendered like /about: no data read, no request read, no ISR.

const TITLE = "Tech & Deals Creators: Follow & Buy Them a Coffee";
const DESCRIPTION =
  "The tech and deals creators we feature: phone, laptop and TV reviews, deal hunting and sale checks. Follow them, and buy your favourite a coffee. Creators: get featured free.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/creators" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE}/creators`, siteName: SITE_NAME, type: "website" },
};

const FAQS = [
  {
    q: "What does “Buy them a coffee” do?",
    a: `It opens the creator's own tip page (Ko-fi, Buy Me a Coffee, Patreon or similar). The money goes straight to them. ${SITE_NAME} never handles it and takes no cut.`,
  },
  {
    q: "Does it cost anything to be featured?",
    a: `No. A listing is free. We ask featured creators to mention ${SITE_NAME} in their content, for example a link in a video description or a price check on screen, and we send our visitors their way in return.`,
  },
  {
    q: "Who can apply?",
    a: "Anyone who makes tech or deals content regularly for Australia, the US or the UK: YouTube, TikTok, Instagram, X, a podcast, a newsletter or a blog. Audience size matters less than making content people trust. A real person reviews every application.",
  },
  {
    q: "Will I see how many clicks my listing sends?",
    a: "Yes. We count clicks on every featured creator's links and tip button, and share the numbers with them on request.",
  },
];

// "How to work with us" (owner, 2026-11-01): flexible on purpose, any one of these is plenty. Creators call us their "partner" in
// their own content, not "sponsor": we don't pay them for a mention.
const WORK_WITH_US = [
  { title: "Link us", body: "Put compareempire.com in your bio, video description or a story link. That's the one thing that helps most." },
  { title: "Shout us out", body: `In the content you already make, a quick line: “check out our partner ${SITE_NAME}” while you review a phone, call out a fake sale or round up the week's deals.` },
  { title: "Show how it works", body: "A short walkthrough or honest review: look up a product, check whether the “was” price was ever real, find the cheapest store. Say what you really think." },
];

const PERKS = [
  { icon: "📣", title: "A spotlight card, free", body: "Your avatar, what you make and every channel you're on, here and in the creators bubble on our homepage." },
  { icon: "☕", title: "A “Buy them a coffee” button", body: "Straight to your own Ko-fi, Patreon or tip page. Fans support you directly; we never touch the money." },
  { icon: "📈", title: "Shoppers about to buy, not random traffic", body: "People visit when they're comparing a phone, a laptop or a TV and want the real price: the people who watch tech reviews." },
  { icon: "🤝", title: "Shout-outs and real numbers", body: "We share your new videos on our socials, and tell you how many clicks your listing sent you." },
];

const APPLY_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} creator feature`)}&body=${encodeURIComponent(
  "Hi! I make tech / deals content and I'd like to be featured.\n\nName / channel:\nWhat I make:\nLinks (YouTube, TikTok, Instagram, X, newsletter…):\nTip page (Ko-fi, Patreon…), if any:\nWhere I'm based:\n",
)}`;

export default function CreatorsPage() {
  const creators = featuredCreators();
  const openSpots = creators.length === 0 ? 3 : (3 - (creators.length % 3)) % 3 || 3;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Creators", item: `${SITE}/creators` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${TITLE} | ${SITE_NAME}`,
      url: `${SITE}/creators`,
      ...(creators.length
        ? {
            mainEntity: {
              "@type": "ItemList",
              itemListElement: creators.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: { "@type": "Person", name: c.name, url: `${SITE}/creators#${c.slug}`, sameAs: c.links.map((l) => l.url) },
              })),
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="container-x max-w-5xl pb-16 pt-8 sm:pt-12">
      {ld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-mute">
        <Link prefetch={false} href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Creators</span>
      </nav>

      {/* Hero */}
      <header className="card relative overflow-hidden p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-save/15 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <span className="eyebrow text-brand">✦ Creators</span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Tech creators we <span className="bg-gradient-to-r from-brand to-[#3D8BFF] bg-clip-text text-transparent">love</span>
          </h1>
          <p className="mt-3 text-base leading-7 text-ink-soft">
            The people who make shopping for tech easier: phone, laptop and TV reviews, deal round-ups and the sale checks that save you
            opening five tabs. Watch them, follow them, and buy your favourite a coffee.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#featured" className="btn-primary min-h-11 px-5">
              Meet the creators
            </a>
            <a href="#apply" className="btn-ghost min-h-11 px-5">
              I make tech content →
            </a>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute right-8 top-6 hidden h-56 w-72 md:block">
          {["left-0 top-8 -rotate-[10deg] from-brand/40 to-brand-soft", "left-[88px] top-0 z-10 rotate-[2deg] from-[#3D8BFF]/40 to-brand-soft", "left-[176px] top-10 rotate-[11deg] from-save/40 to-save-soft"].map((cls) => (
            <div key={cls} className={`absolute h-48 w-36 rounded-lg border border-line bg-gradient-to-br ${cls}`}>
              <div className="m-3 h-20 rounded-lg bg-bg-card/70" />
              <div className="mx-3 mt-3 h-2 w-20 rounded bg-bg-card/70" />
              <div className="mx-3 mt-2 h-2 w-12 rounded bg-bg-card/70" />
            </div>
          ))}
        </div>
      </header>

      {/* Featured creators */}
      <section id="featured" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Featured creators</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {creators.length ? "Newest first. Tap a channel to follow, or buy them a coffee to say thanks." : "Our first creators are joining now. Want to be one of them?"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c, i) => (
            <CreatorCard key={c.slug} creator={c} index={i} />
          ))}
          {/* Open spots fill the last row (a full row of three while the list is empty), so the grid reads as "join us" rather than a
              finished list. Never an invented creator. */}
          {Array.from({ length: openSpots }).map((_, i) => (
            <a key={`open-${i}`} href="#apply" className="group flex min-h-72 flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-bg-card/60 p-6 text-center transition hover:border-brand hover:bg-brand-soft/40">
              <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-[#3D8BFF]/30 text-3xl transition-transform group-hover:scale-110" aria-hidden>
                ✨
              </span>
              <span className="mt-4 font-display text-base font-bold">Your channel here</span>
              <span className="mt-1 max-w-[16rem] text-sm text-ink-soft">Make tech or deals content? Get a free spotlight card and a “Buy them a coffee” button.</span>
              <span className="mt-4 text-sm font-bold text-brand">Apply to be featured →</span>
            </a>
          ))}
        </div>
      </section>

      {/* How tipping works */}
      <section className="card mt-10 grid items-center gap-6 border-brand/30 bg-gradient-to-br from-brand-soft via-bg-card to-bg-card p-6 sm:grid-cols-[auto,1fr] sm:p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#3D8BFF] text-brand-ink">
          <CoffeeIcon className="h-10 w-10" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Buy your favourite creator a coffee</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Every featured creator with a tip page gets a “Buy them a coffee” button. It goes straight to their own Ko-fi, Patreon or tip page,
            so <strong className="text-ink">100% of what you send goes to them</strong>. {SITE_NAME} never handles the money and takes no cut.
            It&rsquo;s the easiest way to say thanks for the review that saved you from a bad buy.
          </p>
        </div>
      </section>

      {/* For creators */}
      <section id="apply" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Make tech content? Let&rsquo;s grow together</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          Mention {SITE_NAME} in your content (a link in your description, a price check on screen, a shout-out in a video) and we feature you
          here, free. Here&rsquo;s what you get.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERKS.map((p) => (
            <div key={p.title} className="card flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-sunk text-xl" aria-hidden>
                {p.icon}
              </span>
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card mt-5 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Apply to be featured</h3>
            <p className="mt-1 text-sm text-ink-soft">Email us your channel links and what you make. A real person replies, usually within a few days.</p>
          </div>
          <a href={APPLY_HREF} className="btn-primary min-h-11 shrink-0 px-5">
            Email us to get featured
          </a>
        </div>
      </section>

      {/* How to work with us */}
      <section id="work-with-us" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">How to work with us</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          Creators often ask how we&rsquo;d like {SITE_NAME} promoted. Honestly, however suits you: no contract, no script, no quota and nothing to
          send us first. We help you, you help us, and we keep featuring you either way.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {WORK_WITH_US.map((w, i) => (
            <li key={w.title} className="card p-5">
              <span className="eyebrow text-brand">Option {i + 1}</span>
              <h3 className="mt-1 font-bold">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-soft">{w.body}</p>
            </li>
          ))}
        </ol>
        <div className="card mt-3 p-5">
          <h3 className="font-bold">Lines you can borrow</h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink-soft">
            <li>“Prices checked on our partner compareempire.com. Link in my bio.”</li>
            <li>“Be sure to check out our partner {SITE_NAME}: it compares prices across stores and shows whether a sale is real.”</li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Please say we&rsquo;re partners (“our partner”, or your platform&rsquo;s partnership label) so your followers know. Ad rules such as the ACCC&rsquo;s
            in Australia, the FTC&rsquo;s in the US and the ASA&rsquo;s in the UK ask for that even when no money changes hands.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="creators-faq">
        <h2 id="creators-faq" className="font-display text-2xl font-bold">
          Creators FAQ
        </h2>
        <dl className="mt-4 space-y-5">
          {FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm text-ink-soft">
        While you&rsquo;re here:{" "}
        <Link prefetch={false} href="/deals" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:text-brand">
          see today&rsquo;s real price drops
        </Link>
        .
      </p>
    </div>
  );
}
