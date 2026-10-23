#!/usr/bin/env bash
# Vercel "Ignored Build Step": exit 0 skips the build, exit 1 builds.
# Builds only production deploys, and skips commits that change nothing the site uses.
if [ "$VERCEL_ENV" != "production" ]; then echo "Skip: $VERCEL_ENV build"; exit 0; fi
if ! git rev-parse HEAD^ >/dev/null 2>&1; then exit 1; fi
changed=$(git diff --name-only HEAD^ HEAD)
if [ -n "$changed" ] && ! echo "$changed" | grep -qvE '^(docs/|README\.md$|COST\.md$|DECISIONS\.md$|\.github/)'; then
  echo "Skip: only docs or workflow files changed"; exit 0
fi
exit 1
