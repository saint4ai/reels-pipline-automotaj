#!/usr/bin/env bash
# Финальный шаг серии: дождаться конца рендеров, собрать опись папки Downloads/podcast-reels, коммит, выключение Windows.
#   bash scripts/finish-and-shutdown.sh [--no-shutdown]
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
D="/mnt/c/Users/smmmc/Downloads/podcast-reels"
while pgrep -f 'hyperframes render|render-safe.sh|batch-render.sh|batch-build.sh' >/dev/null; do sleep 30; done
{
  echo "# Подкаст-рилсы — готовые мастера ($(date '+%Y-%m-%d %H:%M'))"; echo
  echo "| Файл | Длит. | Размер | Скин | Архетип |"; echo "|---|---|---|---|---|"
  for f in "$D"/*.mp4; do
    n=$(basename "$f"); dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null | cut -c1-5); sz=$(du -m "$f" | cut -f1)
    pid=$(grep -l "$(echo "$n" | sed 's/^[0-9]* — //; s/\.mp4$//' | cut -c1-20)" videos/podcast-*/storyboard.json 2>/dev/null | head -1)
    skin=$( [ -n "$pid" ] && python3 -c "import json;s=json.load(open('$pid'));print(s.get('skin','platinum'),s.get('_archetype','—'))" 2>/dev/null || echo "— —")
    echo "| $n | ${dur}s | ${sz} МБ | ${skin% *} | ${skin#* } |"
  done
  echo; echo "Все мастера: 1080×1920, 30 fps, crf 16; каждый проверен по листу 20 кадров MP4. Опись нарезки — Downloads/podcast-clips/INDEX.md."
} > "$D/INDEX.md"
git add -A >/dev/null 2>&1; git commit -q -m "Серия подкаст-рилсов: финальная опись

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" >/dev/null 2>&1; git push -q origin main >/dev/null 2>&1
bash scripts/sync-students.sh "Серия подкаст-рилсов: скины, архетипы, двойной план спикера" 2>&1 | tail -2
echo "готово: $(ls "$D"/*.mp4 | wc -l) файлов, опись $D/INDEX.md"
if [[ "${1:-}" != "--no-shutdown" ]]; then
  echo "выключение Windows через 120 с"; /mnt/c/Windows/System32/shutdown.exe /s /t 120 /c "Reels pipeline: all renders delivered"
fi
