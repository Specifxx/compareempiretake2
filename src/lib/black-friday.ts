// The Black Friday page (/black-friday, /us/black-friday, /uk/black-friday): its dates. Pure: tests/black-friday.test.ts.
//
// WHAT IT LISTS, AND WHAT IT NEVER SAYS. The region's deals (components/DealsView.tsx) under a Black Friday heading, at
// one URL kept every year so links and rankings carry over. Never a "was" price we can't back up, a countdown, "ends
// soon" or an invented sale: we only know what a store asked when the prices were last read.

export function blackFriday(year: number): string {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstThursday = 1 + ((4 - first + 7) % 7);
  return `${year}-11-${String(firstThursday + 22).padStart(2, "0")}`;
}

/** Cyber Monday: three days after Black Friday. */
export function cyberMonday(year: number): string {
  return addDays(blackFriday(year), 3);
}

/** The season the page is about: this year's, or next year's once a week past Cyber Monday. */
export function seasonYear(today: string): number {
  const y = Number(today.slice(0, 4));
  return today > addDays(cyberMonday(y), 7) ? y + 1 : y;
}

/** Whether the homepage links the page: 1 November to a week after Cyber Monday. */
export function inSeason(today: string): boolean {
  const y = Number(today.slice(0, 4));
  return today >= `${y}-11-01` && today <= addDays(cyberMonday(y), 7);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Friday 27 November" */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/**
 * The one-line strip under the header and the nav's first link (DECISIONS.md, "Black Friday strip and Cyber Monday page",
 * 2026-11-07): Black Friday from 1 November to the Saturday after it, then Cyber Monday to the day after Cyber Monday, then
 * nothing. A link, never a pop-up, a countdown or "ends soon".
 */
export function saleStrip(today: string): { path: "/black-friday" | "/cyber-monday"; name: string } | null {
  const y = Number(today.slice(0, 4));
  if (today < `${y}-11-01`) return null;
  if (today <= addDays(blackFriday(y), 1)) return { path: "/black-friday", name: "Black Friday" };
  if (today <= addDays(cyberMonday(y), 1)) return { path: "/cyber-monday", name: "Cyber Monday" };
  return null;
}

/** The questions both pages answer in visible text. `place` is the region in a sentence ("the UK"). */
export function holidayFaq(event: "black-friday" | "cyber-monday", year: number, place: string): { q: string; a: string }[] {
  const bf = longDate(blackFriday(year));
  const cm = longDate(cyberMonday(year));
  const name = event === "black-friday" ? "Black Friday" : "Cyber Monday";
  return [
    {
      q: `When is ${name} ${year}?`,
      a: event === "black-friday"
        ? `Black Friday ${year} is ${bf}, the day after US Thanksgiving. Cyber Monday follows on ${cm}. Many stores in ${place} start their sales in early November and run them through the weekend.`
        : `Cyber Monday ${year} is ${cm}, the Monday after Black Friday (${bf}). Online stores often keep their Black Friday prices through the weekend and end them on Cyber Monday night.`,
    },
    {
      q: `How do I know a ${name} deal is real?`,
      a: "Compare today's price with what the same product cost a week ago and what other stores charge for it now. Every deal on this page is one of those two, from prices we checked ourselves, so a made-up \"was\" price never counts.",
    },
    {
      q: "Are these prices before or after shipping?",
      a: "Item prices as each store lists them. Delivery depends on the store and where you are, so check the price on the store's page before you buy.",
    },
    {
      q: "How often does this page update?",
      a: "With every price check, through the sales and after them. The URL stays the same every year, so bookmark it.",
    },
  ];
}
