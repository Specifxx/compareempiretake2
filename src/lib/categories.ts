/**
 * Every product category, grouped into departments for navigation (the way
 * Kogan or JB group theirs). A category is live once it has scrapers and a
 * data/<id>/catalog.json; until then it shows as "coming soon".
 */
import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
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

export type DepartmentId = "phones-wearables" | "computers" | "pc-parts" | "tv-audio" | "gaming" | "cameras" | "home";

export const DEPARTMENTS: { id: DepartmentId; name: string }[] = [
  { id: "phones-wearables", name: "Phones & Wearables" },
  { id: "computers", name: "Computers" },
  { id: "pc-parts", name: "PC Parts" },
  { id: "tv-audio", name: "TV & Audio" },
  { id: "gaming", name: "Gaming" },
  { id: "cameras", name: "Cameras & Drones" },
  { id: "home", name: "Smart Home" },
];

const c = (id: CategoryId, name: string, noun: string, emoji: string, department: DepartmentId, blurb: string): Category => ({
  id,
  name,
  noun,
  href: `/${id}`,
  live: true,
  emoji,
  department,
  blurb,
});

export const CATEGORIES: Category[] = [
  c("phones", "Phones", "phone", "📱", "phones-wearables", "New, unlocked phones — outright or on a plan."),
  c("tablets", "Tablets", "tablet", "📲", "phones-wearables", "iPad, Galaxy Tab, Surface and more, by storage and Wi-Fi or cellular."),
  c("smartwatches", "Smartwatches", "smartwatch", "⌚", "phones-wearables", "Apple Watch, Galaxy Watch, Garmin and more, by case size and GPS or cellular."),
  c("laptops", "Laptops", "laptop", "💻", "computers", "Every configuration listed separately, so you compare the exact laptop."),
  c("desktops", "Desktop PCs", "desktop PC", "🖥️", "computers", "Prebuilt gaming PCs, all-in-ones and Mac desktops, matched by model code."),
  c("monitors", "Monitors", "monitor", "🖥️", "computers", "Matched by size and model code — gaming, office and creator monitors."),
  c("printers", "Printers", "printer", "🖨️", "computers", "Inkjet, laser and tank printers, matched by model."),
  c("routers", "Wi-Fi & Networking", "router", "📶", "computers", "Wi-Fi 7 routers, mesh systems and modems."),
  c("graphics-cards", "Graphics Cards", "graphics card", "🎮", "pc-parts", "Every RTX, Radeon and Arc card, matched brand by brand."),
  c("cpus", "CPUs", "CPU", "🧠", "pc-parts", "Ryzen and Intel Core processors, matched by exact model."),
  c("ssds", "SSDs & Storage", "SSD", "💾", "pc-parts", "NVMe and SATA SSDs by capacity, so a 2TB never hides behind a 1TB."),
  c("ram", "Memory (RAM)", "RAM kit", "🧩", "pc-parts", "DDR5 and DDR4 kits matched by part number."),
  c("motherboards", "Motherboards", "motherboard", "🔌", "pc-parts", "AM5, LGA1851 and more, matched by exact board."),
  c("tvs", "TVs", "TV", "📺", "tv-audio", "Matched by brand, size and series, so a 65\" never hides behind a 55\"."),
  c("soundbars", "Soundbars", "soundbar", "🔊", "tv-audio", "Dolby Atmos soundbars and home theatre."),
  c("headphones", "Headphones & Earbuds", "pair of headphones", "🎧", "tv-audio", "Noise-cancelling headphones and true wireless earbuds."),
  c("speakers", "Speakers", "speaker", "📻", "tv-audio", "Bluetooth, smart and party speakers."),
  c("consoles", "Consoles", "console", "🕹️", "gaming", "PlayStation, Xbox, Nintendo Switch and handheld gaming PCs."),
  c("cameras", "Cameras", "camera", "📷", "cameras", "Mirrorless, compact and action cameras — body only and kits kept apart."),
  c("drones", "Drones", "drone", "🚁", "cameras", "DJI and more, with combos and controllers kept apart."),
  c("robot-vacuums", "Robot Vacuums", "robot vacuum", "🤖", "home", "Robot vacuums and mops, matched by model."),
];

/** Shown in the header's category bar; everything else is one click away in "All categories". */
export const FEATURED: CategoryId[] = ["phones", "laptops", "tvs", "headphones", "tablets", "monitors", "graphics-cards", "consoles", "smartwatches", "soundbars"];

export const liveCategories = () => CATEGORIES.filter((c) => c.live);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
