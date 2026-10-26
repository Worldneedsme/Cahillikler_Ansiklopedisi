#!/bin/sh
# One-command rebuild of "5 saniyede kazan": events → picture → score → master. LANG_CODE=en or ru for the other versions.
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
L=${LANG_CODE:-tr}
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --q "lang=$L"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --q "lang=$L" --out "$HERE/out/video_$L.mp4"
"$LIB/.venv/bin/python" "$HERE/score.py"
"$LIB/.venv/bin/python" "$HERE/subs.py" "$L"
sh core/render/mux.sh "$HERE/out/video_$L.mp4" "$HERE/out/mix.wav" "$HERE/locca-microgame_$L.mp4" 30 0
