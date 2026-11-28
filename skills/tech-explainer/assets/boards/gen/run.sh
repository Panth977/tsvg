#!/bin/bash
# run.sh N : regenerate board N's source (boardN.mjs → ../src/board-N.tsvg), check it, render it into ../board-N-*.jpg
# Needs the plugin's npm install; set TSVG_CHROME if Chrome isn't at the default path.
D="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$D/../../../../.." && pwd)"
cd "$D" && node "board$1.mjs" || exit 1
cd "$ROOT" && node cli/tsvg.mjs check "skills/tech-explainer/assets/boards/src/board-$1.tsvg" 2>&1 | grep -v "no recorded" | sort -u | head -40
node "$D/shoot.mjs" "$@" | tail -1
