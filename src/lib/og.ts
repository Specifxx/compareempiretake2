/** URL of the share card for a page (see src/app/og/route.tsx). */
export function ogImage(o: { title: string; price?: number; stores?: number; verdict?: string; image?: string; category?: string }): string {
  const q = new URLSearchParams();
  q.set("t", o.title);
  if (o.price) q.set("p", String(Math.round(o.price)));
  if (o.stores) q.set("s", String(o.stores));
  if (o.verdict) q.set("v", o.verdict);
  if (o.image?.startsWith("https://")) q.set("i", o.image);
  if (o.category) q.set("c", o.category);
  return `/og?${q}`;
}
