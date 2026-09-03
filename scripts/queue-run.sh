#!/usr/bin/env bash
# Параллельные очереди: N воркеров на список проектов.
#   bash scripts/queue-run.sh build 3 videos/podcast-12-… videos/podcast-13-… …
#   bash scripts/queue-run.sh render 2 videos/podcast-…
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
mode="$1"; n="$2"; shift 2
case "$mode" in
  build)  printf '%s\n' "$@" | xargs -P "$n" -I{} bash -c 'bash scripts/batch-build.sh "{}" 2>&1 | grep -E "===|CHECK|BLOCKING|листов|не прошла" | cut -c1-170' ;;
  render) printf '%s\n' "$@" | xargs -P "$n" -I{} bash -c 'bash scripts/batch-render.sh "{}" 2>&1 | grep -E "===|RENDER|PASS|FAIL|→" | cut -c1-140' ;;
  *) echo "mode build|render" >&2; exit 2 ;;
esac
