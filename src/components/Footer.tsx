import Link from "next/link";
import { activeCategories, getCatalog } from "@/lib/catalog";
import { Logo } from "./Logo";

export function Footer() {
  const { retailers, updatedAt, phones } = getCatalog();
  return (
    <footer className="mt-24 border-t border-line bg-bg-card">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-ink-soft">
            Independent price comparison for Australians. We check {retailers.length} retailers every day so you don&apos;t have to open {retailers.length} tabs.
            No retailer pays to rank higher — the cheapest price is always first.
          </p>
          <p className="text-xs text-ink-mute">
            {phones.length.toLocaleString()} products tracked · prices last checked{" "}
            {new Date(updatedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" })} AEST
          </p>
        </div>
        <FooterCol title="Shop" links={[["All phones", "/phones"], ["Today's deals", "/deals"], ["Brands", "/brands"], ["Compare", "/compare"], ["Guides", "/guides"], ["All categories", "/categories"]]} />
        <FooterCol title="Categories" links={activeCategories().map((c) => [c.name, c.href] as [string, string])} />
        <FooterCol title="Compare Empire" links={[["About & how it works", "/about"], ["Retailers we check", "/about#retailers"], ["Suggest a store", "/about#feedback"]]} />
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-mute sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Compare Empire. Prices in AUD incl. GST; check the retailer for the final price.</span>
          <span>Made in Australia 🇦🇺</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="text-ink-soft hover:text-ink">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
