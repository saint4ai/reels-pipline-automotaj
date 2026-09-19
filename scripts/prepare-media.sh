#!/usr/bin/env bash
# Готовит запись спикера для проекта: копия без кропа с опорным кадром каждые 30 кадров (иначе HyperFrames
# промахивается при перемотке), речь отдельной дорожкой, пословная расшифровка и длительность в сториборд.
#   bash scripts/prepare-media.sh videos/<project> /путь/к/записи.mp4 [--model medium] [--lang ru]
# Расшифровка — локальный whisper через `hyperframes transcribe` (при первом запуске скачает модель).
# Для русского нужна многоязычная модель: medium (по умолчанию) или large-v3; модели *.en понимают только английский.
set -euo pipefail
project="${1:?укажи videos/<project>}"
src="${2:?укажи путь к записи}"
shift 2
model=medium; lang=ru
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) model="$2"; shift 2 ;;
    --lang) lang="$2"; shift 2 ;;
    *) echo "неизвестный ключ: $1" >&2; exit 2 ;;
  esac
done
[[ -f "$project/storyboard.json" ]] || { echo "нет $project/storyboard.json — сначала bash scripts/new-reel.sh <id>" >&2; exit 2; }
[[ -f "$src" ]] || { echo "нет файла записи: $src" >&2; exit 2; }
mkdir -p "$project/media"

echo "1/4 видео без кропа, опорный кадр каждые 30 кадров"
ffmpeg -v error -y -i "$src" -map 0:v:0 -c:v libx264 -crf 16 -preset medium -g 30 -pix_fmt yuv420p -an "$project/media/speaker-gop30.mp4"
echo "2/4 речь отдельно"
ffmpeg -v error -y -i "$src" -map 0:a:0 -vn -c:a aac -b:a 192k "$project/media/speech.m4a"
ffmpeg -v error -y -i "$src" -map 0:a:0 -vn -ac 1 -ar 16000 "$project/media/asr.wav"

echo "3/4 пословная расшифровка ($model, $lang) → $project/transcript.json"
npx --yes hyperframes@0.8.20 transcribe "$project/media/asr.wav" -d "$project" -m "$model" -l "$lang"

echo "4/4 длительность и размер в storyboard.json"
IFS=x read -r w h < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$project/media/speaker-gop30.mp4")
dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$project/media/speaker-gop30.mp4")"
python3 - "$project/storyboard.json" "$w" "$h" "$dur" <<'PY'
import json, sys
path, w, h, dur = sys.argv[1], sys.argv[2], sys.argv[3], round(float(sys.argv[4]), 2)
sb = json.load(open(path, encoding='utf-8'))
sp = sb.setdefault('sources', {}).setdefault('speaker', {})
sp.update({'file': 'media/speaker-gop30.mp4', 'native': f'{w}x{h}', 'in': 0.0, 'out': dur})
sb['sources'].setdefault('speech', {})['file'] = 'media/speech.m4a'
sb.setdefault('composition', {})['durationSeconds'] = dur
json.dump(sb, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'speaker {w}x{h}, {dur} с')
PY
words="$(python3 -c "import json;print(len(json.load(open('$project/transcript.json'))))")"
echo "готово: $words слов. Проверь опечатки в transcript.json (названия сервисов), затем режиссура по MONTAGE-RUNBOOK."
