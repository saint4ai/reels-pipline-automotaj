#!/usr/bin/env bash
# Очередь подкаст-рилсов: для каждого проекта build (assemble+validate+lint+check) и лист снимков каждые ~2.5 с.
#   bash scripts/batch-build.sh videos/podcast-2-… videos/podcast-3-…      (рендер отдельно после просмотра)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
for P in "$@"; do
  echo "=== $P"
  out=$(python3 scripts/pipe.py build "$P" 2>&1 | grep -E 'BLOCKING|VALIDATE|LINT|CHECK|Traceback' | cut -c1-180 | head -8); echo "$out"
  if echo "$out" | grep -q 'CHECK ok=True'; then
    dur=$(python3 -c "import json;print(json.load(open('$P/storyboard.json'))['composition']['durationSeconds'])")
    ats=$(python3 -c "d=$dur; import math; n=max(6,min(16,int(d/2.5))); print(','.join(f'{(i+0.5)*d/n:.1f}' for i in range(n)))")
    (cd "$P" && rm -rf snapshots && nice -n 10 npx --yes hyperframes@0.8.20 snapshot . --at "$ats" >/dev/null 2>&1; ls snapshots | grep -c contact | sed 's/^/листов снимков: /')
  else
    echo "  сборка не прошла — рендер не ставить"
  fi
done
