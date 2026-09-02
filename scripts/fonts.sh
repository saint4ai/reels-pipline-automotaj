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
cat <<'CSS'
/* Утверждённые гарнитуры (DECISIONS.md 03.09.2026): Manrope ExtraBold/Regular, JetBrains Mono, STIX Two Text Italic. Benzin — запасной H1. */
@font-face{font-family:"Manrope";font-weight:200 800;src:url("assets/fonts/Manrope-Variable.ttf") format("truetype")}
@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url("assets/fonts/JetBrainsMono-Variable.ttf") format("truetype")}
@font-face{font-family:"STIX Two Text";font-weight:700;font-style:italic;src:url("assets/fonts/stix-two-text-cyrillic-700-italic.woff2") format("woff2")}
@font-face{font-family:"STIX Two Text";font-weight:700;font-style:italic;src:url("assets/fonts/stix-two-text-latin-700-italic.woff2") format("woff2")}
@font-face{font-family:"Benzin";font-weight:700;src:url("assets/fonts/Benzin-Bold.otf") format("opentype")}
.h1,.h2,.caption{font-family:"Manrope",sans-serif;font-weight:800}
.body{font-family:"Manrope",sans-serif;font-weight:400}
.mono{font-family:"JetBrains Mono",monospace;font-weight:700}
.caption{font-size:66px}           /* три слова, кегль 66 */
.emph{font-family:"STIX Two Text",serif;font-style:italic;font-weight:700}
CSS
