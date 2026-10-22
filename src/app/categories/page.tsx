import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories",
  description: "Everything Compare Empire compares — phones today, with tablets, laptops, headphones, watches and more on the way.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Categories</h1>
      <p className="mt-2 max-w-xl text-ink-mute">We&apos;re starting with phones and adding a category only when we can cover it properly — every major store, every day.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) =>
          c.live ? (
            <Link key={c.id} id={c.id} href={c.href} className="card p-5 transition hover:shadow-lift">
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-3 font-display text-lg font-bold">{c.name}</div>
              <div className="text-sm text-save">Live now →</div>
            </Link>
          ) : (
            <div key={c.id} id={c.id} className="card scroll-mt-24 p-5 opacity-70">
              <div className="text-3xl grayscale">{c.emoji}</div>
              <div className="mt-3 font-display text-lg font-bold">{c.name}</div>
              <div className="text-sm text-ink-mute">Coming soon</div>
            </div>
          ),
        )}
      </div>
      <p className="mt-8 text-sm text-ink-mute">
        Want one sooner? <Link href="/about#feedback" className="text-brand hover:underline">Tell us which</Link> — we build the most-requested next.
      </p>
    </div>
  );
}
