#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  run-face-caption-qa.sh
#  onAI Academy — авторы пайплайна автомонтажа рилсов
#  Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
#  Источник: https://github.com/saint4ai/reels-pipline-automotaj
#  Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
#  origin=onai-rpa-2026-09  spec=three-laws/v1
# ---------------------------------------------------------------------------
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_dir="$repo_dir/videos/vibecoding-stack-2026-img7333"

# Optional first positional argument: another Reel project directory. Keep option-only calls
# backward compatible so `--sample-every 0.5` still targets the current reference project.
if [[ ${1:-} && ${1:-} != -* ]]; then
  project_dir="$(cd "$1" && pwd)"
  shift
fi

qa_venv="${ONAI_FACE_QA_VENV:-$repo_dir/.venv-face-qa}"
video_path="${ONAI_FACE_QA_VIDEO:-$project_dir/public/input-video.mp4}"

if [[ ! -x "$qa_venv/bin/python" ]]; then
  python3 -m venv "$qa_venv"
fi

if ! "$qa_venv/bin/python" -c 'import cv2, numpy' >/dev/null 2>&1; then
  "$qa_venv/bin/python" -m pip install --disable-pip-version-check --no-input \
    -r "$repo_dir/scripts/requirements-face-qa.txt"
fi

"$qa_venv/bin/python" "$repo_dir/scripts/face-caption-clearance.py" \
  --video "$video_path" \
  --output-json "$project_dir/analysis/face-head-trajectory.sample-1s.json" \
  --output-csv "$project_dir/analysis/face-head-trajectory.sample-1s.csv" \
  --report-md "$project_dir/analysis/face-caption-clearance.md" \
  --contact-sheet "$project_dir/analysis/face-caption-clearance-contact-sheet.jpg" \
  --sample-every 1.0 \
  "$@"
