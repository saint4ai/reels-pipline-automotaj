#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  check-reels-safe-zone.sh
#  onAI Academy — авторы пайплайна автомонтажа рилсов
#  Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
#  Источник: https://github.com/saint4ai/reels-pipline-automotaj
#  Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
#  origin=onai-rpa-2026-09  spec=three-laws/v1
# ---------------------------------------------------------------------------
set -euo pipefail

usage() {
  printf '%s\n' "Usage: $0 --input <master.mp4> --output-dir <renders/qa> [--open]"
}

input=''
output_dir=''
open_result=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      input=${2:-}
      shift 2
      ;;
    --output-dir)
      output_dir=${2:-}
      shift 2
      ;;
    --open)
      open_result=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$input" || -z "$output_dir" ]]; then
  usage >&2
  exit 2
fi
if [[ ! -f "$input" ]]; then
  printf 'Input video was not found: %s\n' "$input" >&2
  exit 1
fi
command -v ffmpeg >/dev/null 2>&1 || { printf 'ffmpeg is required.\n' >&2; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { printf 'ffprobe is required.\n' >&2; exit 1; }

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
overlay="$script_dir/../reference/platform-guides/instagram-reels/safe-zone-1080x1920.png"
if [[ ! -f "$overlay" ]]; then
  printf 'Safe-zone overlay was not found: %s\n' "$overlay" >&2
  exit 1
fi

width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$input" | head -n 1)
height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$input" | head -n 1)
sar=$(ffprobe -v error -select_streams v:0 -show_entries stream=sample_aspect_ratio -of default=nw=1:nk=1 "$input" | head -n 1)
rotation=$(ffprobe -v error -select_streams v:0 -show_entries stream_tags=rotate:stream_side_data=rotation -of default=nw=1:nk=1 "$input" | head -n 1)
duration=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$input" | head -n 1)

[[ "$width" == '1080' && "$height" == '1920' ]] || {
  printf 'Expected 1080x1920, found %sx%s.\n' "$width" "$height" >&2
  exit 1
}
if [[ -n "$sar" && "$sar" != '1:1' && "$sar" != 'N/A' && "$sar" != '0:1' ]]; then
  printf 'Expected square pixels (SAR 1:1), found %s.\n' "$sar" >&2
  exit 1
fi
if [[ -n "$rotation" ]] && ! awk -v value="$rotation" 'BEGIN { exit !(value > -0.01 && value < 0.01) }'; then
  printf 'Expected rotation 0, found %s degrees.\n' "$rotation" >&2
  exit 1
fi
if ! awk -v value="$duration" 'BEGIN { exit !(value > 0) }'; then
  printf 'Expected a positive duration, found %s.\n' "$duration" >&2
  exit 1
fi

mkdir -p -- "$output_dir"
filename=$(basename -- "$input")
stem=${filename%.*}
qa_video="$output_dir/${stem}-reels-safe-zone-qa.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$input" \
  -loop 1 -i "$overlay" \
  -filter_complex '[0:v][1:v]overlay=0:0:format=auto:shortest=1[v]' \
  -map '[v]' -map '0:a?' \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$qa_video"

fractions=(0.05 0.25 0.50 0.75 0.95)
for index in "${!fractions[@]}"; do
  timestamp=$(awk -v d="$duration" -v f="${fractions[$index]}" 'BEGIN { t=d*f; max=d-0.05; if (max<0) max=0; if (t>max) t=max; if (t<0) t=0; printf "%.3f", t }')
  frame_number=$(printf '%02d' "$((index + 1))")
  frame_path="$output_dir/${stem}-reels-safe-zone-frame-${frame_number}.png"
  ffmpeg -hide_banner -loglevel error -y -ss "$timestamp" -i "$qa_video" -frames:v 1 -update 1 "$frame_path"
done

printf 'Safe-zone QA video: %s\n' "$qa_video"
printf 'Five guided frames: %s\n' "$output_dir"
printf '%s\n' 'Visual review is still required: the overlay cannot distinguish decoration from critical content.'

if [[ "$open_result" -eq 1 ]]; then
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$qa_video" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$qa_video"
  fi
fi
