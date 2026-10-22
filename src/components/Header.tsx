"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { HeartIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, CloseIcon } from "./icons";
import { SearchPalette, type SearchItem } from "./SearchPalette";
import { saved } from "@/lib/store";

const NAV = [
  { href: "/phones", label: "Phones" },
  { href: "/deals", label: "Deals" },
  { href: "/brands", label: "Brands" },
  { href: "/compare", label: "Compare" },
];

export function Header({ index }: { index: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const savedList = saved.use();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    const openSearch = () => setOpen(true);
    window.addEventListener("ce:search", openSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ce:search", openSearch);
    };
  }, []);
  useEffect(() => setMenu(false), [path]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-4">
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${path.startsWith(n.href) ? "bg-bg-sunk text-ink" : "text-ink-soft hover:text-ink"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setOpen(true)}
            className="ml-auto flex h-10 flex-1 items-center gap-2 rounded-xl border border-line bg-bg-card px-3 text-sm text-ink-mute shadow-sm transition hover:border-ink/20 sm:max-w-xs md:max-w-sm"
            aria-label="Search phones"
          >
            <SearchIcon className="h-4 w-4" />
            <span className="truncate">Search phones…</span>
            <kbd className="ml-auto hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-ink-mute sm:block">⌘K</kbd>
          </button>
          <Link href="/saved" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk hover:text-ink" aria-label="Saved phones">
            <HeartIcon />
            {savedList.length > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{savedList.length}</span>
            )}
          </Link>
          <ThemeToggle />
          <button className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        {menu && (
          <nav className="container-x grid gap-1 pb-4 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-bg-sunk">
                {n.label}
              </Link>
            ))}
            <Link href="/about" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-bg-sunk">About</Link>
          </nav>
        )}
      </header>
      <SearchPalette open={open} onClose={() => setOpen(false)} items={index} />
    </>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ce-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={flip} className="hidden h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk hover:text-ink sm:grid" aria-label="Toggle dark mode">
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
