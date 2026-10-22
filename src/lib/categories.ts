/**
 * Every product category, grouped into departments for navigation (the way
 * Kogan or JB group theirs). A category is live once it has scrapers and a
 * data/<id>/catalog.json; until then it shows as "coming soon".
 */
import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId | "headphones" | "smartwatches" | "consoles";
  name: string;
  /** Singular noun for copy: "Compare {noun} prices". */
  noun: string;
  href: string;
  live: boolean;
  emoji: string;
  department: DepartmentId;
  /** One line for the category page header. */
  blurb: string;
}

export type DepartmentId = "phones-tablets" | "computers" | "tv-home";

export const DEPARTMENTS: { id: DepartmentId; name: string }[] = [
  { id: "phones-tablets", name: "Phones & Tablets" },
  { id: "computers", name: "Computers" },
  { id: "tv-home", name: "TV & Entertainment" },
];

export const CATEGORIES: Category[] = [
  { id: "phones", name: "Phones", noun: "phone", href: "/phones", live: true, emoji: "📱", department: "phones-tablets", blurb: "New, unlocked phones — outright or on a plan." },
  { id: "tablets", name: "Tablets", noun: "tablet", href: "/tablets", live: true, emoji: "📲", department: "phones-tablets", blurb: "iPad, Galaxy Tab, Surface and more, by storage and Wi-Fi or cellular." },
  { id: "laptops", name: "Laptops", noun: "laptop", href: "/laptops", live: true, emoji: "💻", department: "computers", blurb: "Every configuration listed separately, so you compare the exact laptop." },
  { id: "monitors", name: "Monitors", noun: "monitor", href: "/monitors", live: true, emoji: "🖥️", department: "computers", blurb: "Matched by model code — gaming, office and creator monitors." },
  { id: "graphics-cards", name: "Graphics Cards", noun: "graphics card", href: "/graphics-cards", live: true, emoji: "🎮", department: "computers", blurb: "Every RTX, Radeon and Arc card, matched brand by brand." },
  { id: "tvs", name: "TVs", noun: "TV", href: "/tvs", live: true, emoji: "📺", department: "tv-home", blurb: "Matched by brand, size and series, so a 65\" never hides behind a 55\"." },
  { id: "headphones", name: "Headphones", noun: "headphone", href: "/categories#headphones", live: false, emoji: "🎧", department: "tv-home", blurb: "" },
  { id: "smartwatches", name: "Smartwatches", noun: "smartwatch", href: "/categories#smartwatches", live: false, emoji: "⌚", department: "phones-tablets", blurb: "" },
  { id: "consoles", name: "Consoles", noun: "console", href: "/categories#consoles", live: false, emoji: "🕹️", department: "tv-home", blurb: "" },
];

export const liveCategories = () => CATEGORIES.filter((c) => c.live);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
