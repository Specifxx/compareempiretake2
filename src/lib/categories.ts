/**
 * Every product category Compare Empire covers or plans to. A category goes
 * live when it has a scraper set under scripts/ and a data/<id>/ directory;
 * until then it shows as "coming soon" so the site's shape already fits it.
 */
export interface Category {
  id: string;
  name: string;
  /** Singular noun for copy: "Compare {noun} prices". */
  noun: string;
  href: string;
  live: boolean;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: "phones", name: "Phones", noun: "phone", href: "/phones", live: true, emoji: "📱" },
  { id: "tablets", name: "Tablets", noun: "tablet", href: "/categories#tablets", live: false, emoji: "🪟" },
  { id: "laptops", name: "Laptops", noun: "laptop", href: "/categories#laptops", live: false, emoji: "💻" },
  { id: "headphones", name: "Headphones", noun: "headphone", href: "/categories#headphones", live: false, emoji: "🎧" },
  { id: "smartwatches", name: "Smartwatches", noun: "smartwatch", href: "/categories#smartwatches", live: false, emoji: "⌚" },
  { id: "tvs", name: "TVs", noun: "TV", href: "/categories#tvs", live: false, emoji: "📺" },
  { id: "consoles", name: "Gaming", noun: "console", href: "/categories#consoles", live: false, emoji: "🎮" },
];

export const liveCategories = () => CATEGORIES.filter((c) => c.live);
