#!/usr/bin/env bash
# Кладёт утверждённые шрифты из fonts/ в <project>/assets/fonts и печатает @font-face для index.html.
#   bash scripts/fonts.sh videos/<project>
set -euo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${1:?укажи videos/<project>}"
dst="$project/assets/fonts"; mkdir -p "$dst"
n=0
for f in "$repo"/fonts/*.ttf "$repo"/fonts/*.otf "$repo"/fonts/*.woff2 "$repo"/fonts/LICENSE-*; do
  [ -e "$f" ] || continue
  [ -e "$dst/$(basename "$f")" ] || cp "$f" "$dst/"
  n=$((n+1))
done
echo "в $dst: $n файлов" >&2
[ -e "$repo/fonts/Benzin-ExtraBold.ttf" ] || echo "Benzin отсутствует: H1 пока Gilroy Black (fonts/README.md)" >&2
cat <<'CSS'
/* Утверждённые гарнитуры (DECISIONS.md 02.09.2026). Пути относительно index.html проекта. */
@font-face{font-family:"Gilroy";font-weight:900;font-style:normal;src:url("assets/fonts/Gilroy-Black.ttf") format("truetype")}
@font-face{font-family:"Gilroy";font-weight:800;font-style:normal;src:url("assets/fonts/Gilroy-Heavy.ttf") format("truetype")}
@font-face{font-family:"Gilroy";font-weight:500;font-style:normal;src:url("assets/fonts/Gilroy-Medium.ttf") format("truetype")}
@font-face{font-family:"Gilroy";font-weight:400;font-style:normal;src:url("assets/fonts/Gilroy-Regular.ttf") format("truetype")}
@font-face{font-family:"STIX Two Text";font-weight:700;font-style:italic;src:url("assets/fonts/stix-two-text-cyrillic-700-italic.woff2") format("woff2")}
@font-face{font-family:"STIX Two Text";font-weight:700;font-style:italic;src:url("assets/fonts/stix-two-text-latin-700-italic.woff2") format("woff2")}
/* H1: Benzin, когда файл появится; до этого Gilroy 900 */
.h1{font-family:"Benzin","Gilroy",sans-serif;font-weight:900}
.h2,.caption{font-family:"Gilroy",sans-serif;font-weight:900}
.caption{font-size:66px}           /* три слова, кегль 66 */
.emph{font-family:"STIX Two Text",serif;font-style:italic;font-weight:700}
CSS
