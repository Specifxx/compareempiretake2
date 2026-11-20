// The LEGO Pokémon hub (lib/lego-pokemon.ts): only LEGO sets naming Pokémon or Pikachu with a set number, in stock first, most
// stores first; indexed only where one set is at three stores or more; in the sitemap, IndexNow and the routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { displayName, LEGO_POKEMON_REGIONS, legoPokemonFaq, legoPokemonIndexable, legoPokemonSets, setNumber } from "../src/lib/lego-pokemon";
import type { PhoneSummary } from "../src/lib/catalog";

const s = (name: string, bestPrice: number, retailerCount: number, extra: Partial<PhoneSummary> = {}): PhoneSummary =>
  ({ slug: name, name, model: name, bestPrice, retailerCount, href: `/lego/${name}`, category: "lego", brand: "LEGO", inStock: true, ...extra }) as unknown as PhoneSummary;

test("only LEGO Pokémon sets with a set number; in stock, then most stores, then cheapest", () => {
  const out = legoPokemonSets([
    s("LEGO Technic McLaren MCL39 F1 Car 42228", 259, 11),
    s("LEGO POKEMON TRAINER POKE BALL 72154", 344, 9),
    s("LEGO Pokémon Venusaur, Charizard and Blastoise 72153", 600, 5),
    s("LEGO Pokemon Pikachu and Poke Ball 72152", 143, 9, { inStock: false }),
    s("LEGO Pokémon gift card", 50, 3),
    s("Pokemon Poke Ball 72999", 10, 4, { category: "consoles" } as Partial<PhoneSummary>),
  ]);
  assert.deepEqual(out.map(setNumber), ["72154", "72153", "72152"]);
});

test("display names are tidy and keep the set number", () => {
  assert.equal(displayName(s("LEGO POKEMON TRAINER POKE BALL 72154", 1, 1)), "LEGO Pokémon Trainer Poké Ball (72154)");
  assert.equal(displayName(s("LEGO Pokémon: Iconic Trainer Moments Pokeball 72154", 1, 1)), "LEGO Pokémon Iconic Trainer Moments Poké Ball (72154)");
});

test("indexable only with a set at three or more stores in stock", () => {
  assert.equal(legoPokemonIndexable([s("LEGO Pokemon 72152", 1, 2)]), false);
  assert.equal(legoPokemonIndexable([s("LEGO Pokemon 72152", 1, 3, { inStock: false })]), false);
  assert.equal(legoPokemonIndexable([s("LEGO Pokemon 72152", 1, 3)]), true);
});

test("the FAQ answers from the data only", () => {
  const faq = legoPokemonFaq("Australia", [s("LEGO Pokemon Pikachu 72152", 143, 9)], (n) => `$${n}`);
  assert.match(faq[0].a, /\$143/);
  assert.match(faq[0].a, /9 stores/);
  assert.match(legoPokemonFaq("Australia", [], String)[0].a, /None of the stores/);
});

test("the hub is in the sitemap, IndexNow, the LEGO page and the routes", () => {
  assert.deepEqual(LEGO_POKEMON_REGIONS, ["au", "us", "uk"]);
  assert.match(readFileSync("src/lib/seo.ts", "utf8"), /"\/lego-pokemon"/);
  assert.match(readFileSync("scripts/indexnow.ts", "utf8"), /lego-pokemon/);
  assert.match(readFileSync("src/views/CategoryView.tsx", "utf8"), /\/lego-pokemon/);
  for (const r of ["", "us/", "uk/"]) assert.match(readFileSync(`src/app/${r}lego-pokemon/page.tsx`, "utf8"), /LegoPokemonView/);
});
