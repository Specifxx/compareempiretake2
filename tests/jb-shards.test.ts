import test from "node:test";
import assert from "node:assert/strict";
import { shardOf } from "../scripts/scrapers/categories/jbhifi";

// The four JB runners (refresh-jbhifi.yml) must between them read every category exactly once, in similar loads.
const CATS = ["tvs", "monitors", "graphics-cards", "laptops", "tablets", "smartwatches", "desktops", "routers", "cpus", "soundbars", "headphones", "speakers", "consoles", "cameras", "drones", "robot-vacuums", "vacuums", "coffee-machines"] as never[];

test("every category belongs to exactly one JB shard", () => {
  const all = [1, 2, 3, 4].flatMap((i) => shardOf(CATS, i, 4));
  assert.equal(all.length, CATS.length);
  assert.deepEqual([...new Set(all)].sort(), [...CATS].sort());
});

test("no JB shard is empty", () => {
  for (const i of [1, 2, 3, 4]) assert.ok(shardOf(CATS, i, 4).length >= 3);
});
