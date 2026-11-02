import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// scripts/vercel-ignore-build.sh: exit 0 skips the build, exit 1 builds (owner, 2026-11-02: Vercel spend capped).
const run = (msg: string, env = "production") =>
  spawnSync("bash", ["scripts/vercel-ignore-build.sh"], {
    env: { ...process.env, VERCEL_GIT_COMMIT_MESSAGE: msg, VERCEL_ENV: env, VERCEL_GIT_PREVIOUS_SHA: "" },
  }).status;

test("production builds only when the SUBJECT carries [deploy]", () => {
  assert.equal(run("data: daily prices 2026-11-03 [deploy]"), 1);
  assert.equal(run("Store survey round 15: 4 more stores"), 0);
  assert.equal(run("feat: thing\n\nno [deploy] marker on purpose"), 0);
});

test("previews need [preview]", () => {
  assert.equal(run("feat [deploy]", "preview"), 0);
  assert.equal(run("feat [preview]", "preview"), 1);
});

test("the daily price commit carries the release marker", async () => {
  const { readFileSync } = await import("node:fs");
  assert.match(readFileSync(".github/workflows/refresh-prices.yml", "utf8"), /git commit -m "data: daily prices [^"]*\[deploy\]"/);
});
