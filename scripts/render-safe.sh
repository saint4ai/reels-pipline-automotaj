#!/usr/bin/env bash
# Рендер с фильтрацией вывода: fail fast, explain, verify.
#
#   bash scripts/render-safe.sh <project> [renders/out.mp4] [--draft]     # run_in_background: true
#
# Что делает: статический lint до Chrome → рендер с --strict --quiet, полный лог в logs/render/ →
# позитивная проверка файла (размер, длительность, звук, битрейт) → contact sheet с safe-zone.
# Печатает не больше ~15 строк. Код возврата: 0 OK, 2 lint, 3 файла нет, 4 QA, иначе код рендера.
# RENDER_GPU=hardware — пробный аппаратный путь Chrome; по умолчанию детерминированный SwiftShader.

set -uo pipefail

project="${1:?укажи директорию проекта}"
output="${2:-renders/out.mp4}"
quality="high"; crf="16"
[[ "${3:-}" == "--draft" ]] && { quality="draft"; crf="26"; }

project_dir="$(cd "$project" && pwd)"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_abs="$project_dir/$output"
log_dir="$repo_root/logs/render"
mkdir -p "$log_dir" "$(dirname "$out_abs")"
log="$log_dir/$(basename "$project_dir")-$(date +%Y%m%d-%H%M%S).log"
pipe="$repo_root/scripts/pipe.py"

# 0. Свежесть плана: композиция старше сториборда — сказать, но не блокировать.
if [[ -f "$project_dir/storyboard.json" && -f "$project_dir/index.html" && "$project_dir/storyboard.json" -nt "$project_dir/index.html" ]]; then
  echo "  [ACTIONABLE] index.html старше storyboard.json — рендерится старый план"
fi

# 0b. Провенанс: index.html должен быть собран из текущего storyboard.json (schema ≥ 7).
if [[ -f "$project_dir/storyboard.json" && "${RENDER_FORCE:-}" != "1" ]]; then
  want="storyboard:$(sha256sum "$project_dir/storyboard.json" | cut -c1-12)"
  have="$(grep -oE 'name="hf-assembled" content="[^"]+"' "$project_dir/index.html" 2>/dev/null | sed 's/.*content="//; s/"$//')"
  schema="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8-sig')).get('schemaVersion',0))" "$project_dir/storyboard.json" 2>/dev/null || echo 0)"
  if [[ "$schema" -ge 7 && "$have" != "$want" ]]; then
    echo "RENDER REFUSED  index.html не собран из текущего storyboard.json (${have:-без метки} ≠ $want)"
    echo "  [BLOCKING] python3 scripts/pipe.py build $project — или RENDER_FORCE=1, если это осознанно"
    exit 5
  fi
fi

# 1. Статический lint до Chrome: секунды вместо минут, и причина отказа видна.
lint_out="$(python3 "$pipe" lint "$project_dir" 2>&1)"; lint_code=$?
if (( lint_code != 0 )); then
  echo "RENDER SKIPPED  линтер не пропустил"
  printf '%s\n' "$lint_out" | sed 's/^/  /'
  exit 2
fi

# 2. Кадры в RAM, один worker, idle-приоритет, четыре ядра: машина остаётся отзывчивой.
cache=""
if [[ -d /dev/shm && -w /dev/shm ]]; then
  cache="$(mktemp -d /dev/shm/hf-render.XXXXXX)"
  trap '[[ -n "$cache" && "$cache" == /dev/shm/hf-render.* ]] && rm -rf -- "$cache"' EXIT INT TERM
fi
cpus="$(nproc)"; (( cpus > 4 )) && cpus=4
gpu_flag="--no-browser-gpu"
if [[ "${RENDER_GPU:-}" == "hardware" ]]; then gpu_flag=""; export PRODUCER_BROWSER_GPU_MODE=hardware; fi

start=$SECONDS
nice -n 10 ionice -c 3 taskset -c "0-$((cpus - 1))" \
  npx --yes hyperframes@0.8.20 render "$project_dir" \
    --output "$out_abs" \
    --fps 30 --quality "$quality" --crf "$crf" --workers 1 \
    ${cache:+--frames-cache-dir "$cache"} \
    $gpu_flag --sdr --strict --quiet \
  > "$log" 2>&1
code=$?
elapsed=$((SECONDS - start))

# 3. Провал: код возврата — единственный источник истины. Строки с ошибкой — пояснение.
err_re='ERROR:|\[error\]|Error:|✖|Aborting|ENOENT'
if (( code != 0 )); then
  echo "RENDER FAILED  exit=$code  ${elapsed}s"
  if grep -qE "$err_re" "$log"; then
    grep -nE "$err_re" "$log" | grep -viE 'warn|deprecat' | head -6 | cut -c1-200 | sed 's/^/  [BLOCKING] /'
  else
    echo "  [BLOCKING] в логе нет строки с ошибкой: --quiet глушит причину. Хвост лога:"
    tail -n 4 "$log" | cut -c1-200 | sed 's/^/    /'
    echo "  подсказка: python3 scripts/pipe.py check $project"
  fi
  echo "  лог: $log ($(wc -c < "$log") байт)"
  exit "$code"
fi
if [[ ! -s "$out_abs" ]]; then
  echo "RENDER FAILED  exit=0, но файл не создан: $output"
  tail -n 4 "$log" | cut -c1-200 | sed 's/^/  [BLOCKING] /'
  echo "  лог: $log"
  exit 3
fi

# 4. Успех подтверждается файлом, а не отсутствием плохих слов в логе.
size=$(du -h "$out_abs" | cut -f1)
echo "RENDER OK  $output  ${size}  ${elapsed}s  quality=$quality"
qa_out="$(python3 "$pipe" qa "$project_dir" "$out_abs" 2>&1)"; qa_code=$?
printf '%s\n' "$qa_out" | sed 's/^/  /'
echo "  лог: $log ($(wc -c < "$log") байт, агенту не нужен)"
(( qa_code != 0 )) && exit 4
exit 0
