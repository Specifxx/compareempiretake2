#!/usr/bin/env bash
# bash social/reels/build.sh <outdir> [siteId] [YYYY-MM-DD] -> <outdir>/reel.mp4, cover.png, caption.txt
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; out="$1"; shift || true
node "$here/pick.mjs" "$out" "$@"
node "$here/render.mjs" "$out/spec.json" "$out"
python3 "$here/music.py" "$out/timeline.json" "$out/music.wav" "$(date +%j)"
ffmpeg -loglevel error -y -i "$out/video-silent.mp4" -i "$out/music.wav" -c:v copy -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5 -shortest "$out/reel.mp4"
echo "$out/reel.mp4"
