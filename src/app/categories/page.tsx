import type { Metadata } from "next";
import Link from "next/link";
import { activeCategories, getProducts } from "@/lib/catalog";
import { DEPARTMENTS } from "@/lib/categories";

export const metadata: Metadata = {
  title: "All categories",
  description: "Everything Compare Empire compares: phones, tablets, smartwatches, laptops, PC parts, TVs, audio, gaming, cameras and more across Australian stores.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  const live = activeCategories();
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">All categories</h1>
      <p className="mt-2 max-w-xl text-ink-mute">Every category we compare, checked at every store we cover each morning.</p>
      {DEPARTMENTS.map((d) => {
        const cats = live.filter((c) => c.department === d.id);
        if (!cats.length) return null;
        return (
          <section key={d.id} className="mt-10">
            <h2 className="eyebrow mb-3">{d.name}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cats.map((c) => (
                <Link key={c.id} id={c.id} href={c.href} className="card scroll-mt-24 p-5 transition hover:shadow-lift">
                  <div className="text-3xl">{c.emoji}</div>
                  <div className="mt-3 font-display text-lg font-bold leading-tight">{c.name}</div>
                  <div className="mt-1 text-sm text-ink-mute">{getProducts(c.id).length.toLocaleString()} products</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <p className="mt-10 text-sm text-ink-mute">
        Missing something? <Link href="/about#feedback" className="text-brand hover:underline">Tell us</Link> — we add the most-requested next.
      </p>
    </div>
  );
}
