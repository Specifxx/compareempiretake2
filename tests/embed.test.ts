import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { badgeHtml, embedSnippet, esc, parseProductPath, textBadge } from "../src/lib/embed";

const ROOT = path.join(__dirname, "..");

test("parseProductPath reads a product's own address, any form, and nothing else", () => {
  assert.deepEqual(parseProductPath("/us/tvs/lg-oled-c5"), { region: "us", category: "tvs", slug: "lg-oled-c5" });
  assert.deepEqual(parseProductPath("phones/apple-iphone-17"), { region: "au", category: "phones", slug: "apple-iphone-17" });
  assert.deepEqual(parseProductPath("https://compareempire.com/uk/headphones/sony-wh-1000xm6?x=1#top"), { region: "uk", category: "headphones", slug: "sony-wh-1000xm6" });
  for (const bad of [null, "", "/us/phones", "/fr/phones/x", "/us/not-a-category/x", "/us/phones/X Y", "/us/phones/x/y", "/../../etc/passwd"]) {
    assert.equal(parseProductPath(bad), null, String(bad));
  }
});

test("the badge escapes everything, is noindex and carries no script", () => {
  const html = badgeHtml({ site: "Compare Empire", name: `<b>"x"</b>`, meta: "m", price: "from $1", sub: "2 stores", href: "https://compareempire.com/a?b=1&c=2", image: null });
  assert.match(html, /noindex/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<b>"x"/);
  assert.match(html, /&amp;c=2/);
  assert.equal(esc(`<&">`), "&lt;&amp;&quot;&gt;");
});

test("the snippet is an iframe plus one plain link to the same product page", () => {
  const s = embedSnippet("https://compareempire.com", "Compare Empire", "/us/tvs/lg", "LG");
  assert.match(s, /<iframe src="https:\/\/compareempire\.com\/embed\/price\?p=\/us\/tvs\/lg"/);
  assert.match(s, /<a href="https:\/\/compareempire\.com\/us\/tvs\/lg">/);
  assert.doesNotMatch(textBadge("https://compareempire.com", "Compare Empire", "/us/tvs", "tv"), /<iframe|<script/);
});

test("only the widget response may be framed, and it is CDN-cached for a day", () => {
  const route = readFileSync(path.join(ROOT, "src/app/embed/price/route.ts"), "utf8");
  assert.match(route, /"Content-Security-Policy": "frame-ancestors \*"/);
  assert.match(route, /"X-Robots-Tag": "noindex"/);
  assert.match(route, /Vercel-CDN-Cache-Control": "public, s-maxage=86400/);
  assert.doesNotMatch(readFileSync(path.join(ROOT, "next.config.mjs"), "utf8"), /frame-ancestors/);
});
