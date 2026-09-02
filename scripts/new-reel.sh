#!/usr/bin/env bash
# Новый проект рилса из эталона reels-1-composio: parts/, шрифты, знаки, звуки, шаблон сториборда.
#   bash scripts/new-reel.sh <project-id>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ID="${1:?project-id}"
SRC="$ROOT/videos/reels-1-composio"
DST="$ROOT/videos/$ID"
[[ -e "$DST" ]] && { echo "уже есть: $DST" >&2; exit 2; }
mkdir -p "$DST"/{assets/brand,assets/sfx,assets/fonts,assets/vendor,media,parts,renders/qa,logs}
cp "$SRC"/parts/scenes.{html,css,js} "$DST/parts/"
cp "$SRC"/assets/brand/*.svg "$DST/assets/brand/" 2>/dev/null || true
cp "$SRC"/assets/sfx/*.wav "$DST/assets/sfx/" 2>/dev/null || true
cp "$SRC"/assets/fonts/* "$DST/assets/fonts/" 2>/dev/null || true
cp "$SRC"/assets/vendor/* "$DST/assets/vendor/" 2>/dev/null || true
cp "$SRC/frame.md" "$DST/frame.md"
python3 - "$SRC/storyboard.json" "$DST/storyboard.json" "$ID" <<'PY'
import json,sys
src,dst,pid=sys.argv[1:4]
sb=json.load(open(src,encoding='utf-8'))
sb['projectId']=pid; sb['composition']['id']=pid; sb['composition']['durationSeconds']=0
sb['sources']={"speaker":{"file":"media/speaker-gop30.mp4","native":"1080x1920","in":0.0,"out":0.0},
               "speech":{"file":"media/speech.m4a"}}
sb['captions']['words']=[]; sb['captions']['emphasis']=[]
sb['speakerWindow']['moves']=[]
sb['clips']=[]; sb['transitions']=[]; sb['markers']=[]; sb['audio']['hits']=[]
sb['scenes']=[{"id":"hook","from":0.0,"to":3.0,"kind":"kinetic","zone":{"x":96,"y":96,"w":888,"h":440},"tint":"lime",
               "kicker":"КИКЕР × ТЕМА","stack":[{"at":0.0,"word":"","text":"ПЕРВАЯ СТРОКА","role":"light"},{"at":0.6,"word":"","text":"ГЛАВНОЕ","role":"heavy"}]},
              {"id":"card-1","from":3.0,"to":8.0,"kind":"card","zone":{"x":96,"y":96,"w":888,"h":688},"tint":"orange",
               "eyebrow":"01 / ТЕМА","headline":"ЗАГОЛОВОК **МАРКЕР**","subline":{"at":3.6,"text":"рукописный подстрочник"},
               "objects":[{"kind":"note","at":5.0,"word":"","text":"подпись к объекту","box":{"x":60,"y":420,"w":600,"h":56}}]},
              {"id":"card-2","from":8.0,"to":12.0,"kind":"card","zone":{"x":96,"y":96,"w":888,"h":600},"tint":"lime",
               "eyebrow":"02 / ТЕМА","headline":"рукописный заголовок","headlineStyle":"script","subline":{"at":8.6,"text":"ПОДСТРОЧНИК КАПСОМ","style":"sans"},"objects":[]}]
sb['_template']="Заполнить: sources, captions.words (транскрипт со словами), scenes по словам, clips по пропорции источников, moves ≤ 10 с. Удалить этот ключ."
json.dump(sb,open(dst,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
PY
cat > "$DST/ASSET_SOURCES.md" <<EOF
# Происхождение материалов — $ID

| Файл | Что | Параметры | Источник |
|---|---|---|---|
| assets/… | съёмка спикера | ШxВ, длительность | Александр |
EOF
cat > "$DST/DIRECTION.md" <<EOF
# $ID — режиссёрские решения

## v1
- Тезис ролика:
- Сцены и почему:
- Состояния спикера и смены:
EOF
echo "создан $DST"
echo "дальше: медиа в assets/ и media/ (без кропа, -g 30) → captions.words → scenes → python3 scripts/pipe.py build videos/$ID"
