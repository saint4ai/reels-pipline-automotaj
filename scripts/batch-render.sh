#!/usr/bin/env bash
# Очередь рендера подкаст-рилсов: render-safe → лист 20 кадров из MP4 → копия в Downloads/podcast-reels под именем «балл — заголовок».
#   bash scripts/batch-render.sh videos/podcast-2-… videos/podcast-4-…
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
D="/mnt/c/Users/smmmc/Downloads/podcast-reels"; mkdir -p "$D"
for P in "$@"; do
  id=$(basename "$P"); echo "=== $id"
  out=$(bash scripts/render-safe.sh "$P" "renders/$id.mp4" 2>&1 | grep -E 'RENDER|PASS|FAIL|BLOCKING' | cut -c1-120); echo "$out"
  if echo "$out" | grep -q 'RENDER OK'; then
    mkdir -p "$P/renders/qa"
    ffmpeg -v error -y -i "$P/renders/$id.mp4" -vf "select='not(mod(n\,73))',scale=270:-1,tile=4x5" -frames:v 1 -update 1 "$P/renders/qa/$id-full-sheet.jpg"
    name=$(python3 - "$P" <<'PY'
import json,sys,re
sb=json.load(open(sys.argv[1]+'/storyboard.json',encoding='utf-8'))
idx=json.load(open('reference/clips-index-final.json',encoding='utf-8'))
src=sb['sources']['speaker'].get('origin','')
m=re.search(r'([0-9.]+)–([0-9.]+)',src); s=float(m.group(1)) if m else None
c=min(idx,key=lambda c:abs(c['start_sec']-s)) if s is not None else None
t=re.sub(r'[/\\:*?"<>|]','',c['title']).strip()[:70] if c else sys.argv[1].split('/')[-1]
print(f"{int(c['score']):02d} — {t}" if c else t)
PY
)
    cp "$P/renders/$id.mp4" "$D/$name.mp4" && echo "  → $name.mp4"
  fi
done
