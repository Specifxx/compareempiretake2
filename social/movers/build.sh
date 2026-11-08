#!/usr/bin/env bash
# bash social/movers/build.sh <outdir> <siteId> [--offline] -> <outdir>/movers.mp4, cover.png, caption.txt, links.txt, spec.json
# The week's price movers for one site (pick.mjs), drawn by stage.html through the daily reel's renderer and music.
# Exits 3 when the site has too few clean moves this week (nothing is written but the folder).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; out="$1"; site="$2"; shift 2
node "$here/pick.mjs" "$out" "$site" "$@"
node "$here/../reels/render.mjs" "$out/spec.json" "$out"
python3 "$here/../reels/music.py" "$out/timeline.json" "$out/music.wav" "$(( $(date +%V) * 7 + ${#site} ))"
ffmpeg -loglevel error -y -i "$out/video-silent.mp4" -i "$out/music.wav" -c:v copy -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5 -shortest "$out/movers.mp4"
rm -f "$out/video-silent.mp4" "$out/music.wav"
echo "$out/movers.mp4"
