import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// scripts/vercel-ignore-build.sh against a throwaway repository: exit 0 skips the build, exit 1 builds.
const SCRIPT = path.join(__dirname, "..", "scripts", "vercel-ignore-build.sh");
const GIT_ENV = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com" };

function repo() {
  const dir = mkdtempSync(path.join(tmpdir(), "ignore-build-"));
  const git = (...args: string[]) => execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { cwd: dir, env: { ...process.env, ...GIT_ENV }, encoding: "utf8" }).trim();
  git("init", "-q");
  const commit = (files: string[]) => {
    for (const f of files) {
      mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      writeFileSync(path.join(dir, f), `${f} ${Math.random()}\n`);
    }
    git("add", "-A");
    git("commit", "-q", "-m", "c");
    return git("rev-parse", "HEAD");
  };
  const builds = (env: Record<string, string> = {}) => {
    const r = spawnSync("bash", [SCRIPT], { cwd: dir, env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: "", VERCEL_ENV: "production", ...env }, encoding: "utf8" });
    assert.ok(r.status === 0 || r.status === 1, r.stderr);
    return r.status === 1;
  };
  return { commit, builds, done: () => rmSync(dir, { recursive: true, force: true }) };
}

test("ignore step: only production builds, and the first commit always builds", () => {
  const r = repo();
  try {
    r.commit(["README.md"]);
    assert.equal(r.builds(), true, "no parent commit");
    assert.equal(r.builds({ VERCEL_ENV: "preview" }), false);
  } finally {
    r.done();
  }
});

test("ignore step: docs, workflows and raw/history/archive data skip; anything the site reads builds", () => {
  const r = repo();
  try {
    r.commit(["src/app/page.tsx"]);
    for (const skip of [["README.md"], ["docs/x.md", "DECISIONS.md"], [".github/workflows/x.yml"], ["data/phones/history/2026-10-26.json"], ["data/us/tvs/raw/x.json", "data/archive/y.json"]]) {
      r.commit(skip);
      assert.equal(r.builds(), false, skip.join(" "));
    }
    for (const build of [["data/phones/catalog.json"], ["data/us/ebay.json"], ["data/status.json"], ["src/lib/x.ts"], ["tests/x.test.ts"], ["data/phones/history/a.json", "data/phones/series.json"]]) {
      r.commit(build);
      assert.equal(r.builds(), true, build.join(" "));
    }
  } finally {
    r.done();
  }
});

test("ignore step: a push is judged since the last deploy, not by its last commit", () => {
  const r = repo();
  try {
    const deployed = r.commit(["src/app/page.tsx"]);
    r.commit(["src/lib/catalog.ts"]);
    r.commit(["DECISIONS.md"]);
    assert.equal(r.builds({ VERCEL_GIT_PREVIOUS_SHA: deployed }), true, "the code commit before the docs commit");
    assert.equal(r.builds(), false, "without a previous deploy only the last commit counts");
    assert.equal(r.builds({ VERCEL_GIT_PREVIOUS_SHA: "0123456789abcdef0123456789abcdef01234567" }), false, "a previous deploy outside the clone falls back to HEAD^");
    const docsOnly = r.commit(["docs/a.md"]);
    r.commit(["README.md"]);
    assert.equal(r.builds({ VERCEL_GIT_PREVIOUS_SHA: docsOnly }), false);
  } finally {
    r.done();
  }
});
