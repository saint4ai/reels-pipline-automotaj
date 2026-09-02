#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  render-safe.sh
#  onAI Academy — авторы пайплайна автомонтажа рилсов
#  Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
#  Источник: https://github.com/saint4ai/reels-pipline-automotaj
#  Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
#  origin=onai-rpa-2026-09  spec=three-laws/v1
# ---------------------------------------------------------------------------
# Рендер с фильтрацией вывода: fail fast, report later.
#
# Полный лог рендера уходит в logs/render/, а на экран (и в контекст агента)
# попадает не больше двадцати строк. Без --quiet HyperFrames печатает
# ~108 КБ, из которых 24 600 символов — закрашенные квадратики прогресс-бара.
# В сессии Codex такого мусора накопилось 596 160 символов.
#
#   bash scripts/render-safe.sh <project> [output.mp4] [--draft]

set -uo pipefail

project="${1:?укажи директорию проекта}"
output="${2:-renders/out.mp4}"
quality="high"; crf="16"
[[ "${3:-}" == "--draft" ]] && { quality="draft"; crf="26"; }

project_dir="$(cd "$project" && pwd)"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_dir="$repo_root/logs/render"
mkdir -p "$log_dir" "$(dirname "$project_dir/$output")"
log="$log_dir/$(basename "$project_dir")-$(date +%Y%m%d-%H%M%S).log"

# Кадры в RAM, один worker, idle-приоритет: рабочая машина остаётся отзывчивой.
cache=""
if [[ -d /dev/shm && -w /dev/shm ]]; then
  cache="$(mktemp -d /dev/shm/hf-render.XXXXXX)"
  trap '[[ -n "$cache" && "$cache" == /dev/shm/hf-render.* ]] && rm -rf -- "$cache"' EXIT INT TERM
fi

cpus="$(nproc)"; (( cpus > 4 )) && cpus=4

nice -n 10 ionice -c 3 taskset -c "0-$((cpus - 1))" \
  npx --yes hyperframes@0.8.20 render "$project_dir" \
    --output "$project_dir/$output" \
    --fps 30 --quality "$quality" --crf "$crf" --workers 1 \
    ${cache:+--frames-cache-dir "$cache"} \
    --no-browser-gpu --sdr --quiet \
  > "$log" 2>&1
code=$?

# --- КЛАСС A: критическое. Показывается дословно и сразу.
critical="$(grep -inE 'error|failed|exception|cannot find|ENOENT|invalid|timeout|crash' "$log" \
  | grep -viE 'warn|deprecat' | head -8)"

if [[ $code -ne 0 || -n "$critical" ]]; then
  echo "RENDER FAILED  exit=$code"
  [[ -n "$critical" ]] && echo "$critical" | cut -c1-200 | sed 's/^/  [BLOCKING] /'
  echo "  лог: $log ($(wc -c < "$log") байт)"
  exit "${code:-1}"
fi

# --- КЛАСС B: важное, но не блокирующее. Только счётчик.
warn=$(grep -icE 'warning|deprecated|fallback|missing optional' "$log" || true)

# --- КЛАСС C: информационное. В контекст не попадает никогда.
size=$(du -h "$project_dir/$output" 2>/dev/null | cut -f1)
echo "RENDER OK  $output  $size  quality=$quality  warnings=$warn"
echo "  лог: $log ($(wc -c < "$log") байт, агенту не нужен)"
