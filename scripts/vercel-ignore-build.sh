#!/usr/bin/env bash
# Vercel "Ignored Build Step": exit 0 skips the build, exit 1 builds.
# Builds only production deploys, and skips pushes that change nothing the site uses.
if [ "$VERCEL_ENV" != "production" ]; then echo "Skip: $VERCEL_ENV build"; exit 0; fi
# Judge everything since the last successful deploy (Vercel sets VERCEL_GIT_PREVIOUS_SHA in this step), so a
# push of several commits whose last one only touches docs still builds the code before it. Fall back to the
# last commit alone when there is no previous deploy or its commit isn't in the shallow clone.
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  if ! git rev-parse -q --verify HEAD^ >/dev/null 2>&1; then exit 1; fi
  base=HEAD^
fi
changed=$(git diff --name-only "$base" HEAD)
# data/**/raw, history and archive are scrape inputs and backfills: no page reads them (only
# src/lib/catalog.ts and src/lib/guides.ts touch the disk). tests/ and scripts/ still build, because
# `next build` typechecks them (tsconfig "**/*.ts").
if [ -n "$changed" ] && ! echo "$changed" | grep -qvE '^(docs/|README\.md$|COST\.md$|DECISIONS\.md$|\.github/|data/(.+/)?(raw|history|archive)/)'; then
  echo "Skip: only docs, workflow or raw/history data files changed since $base"; exit 0
fi
exit 1
