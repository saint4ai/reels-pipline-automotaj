#!/usr/bin/env bash
# Переносит обновления паттернов в студенческий репозиторий поверх его истории (README, LICENSE, projects/ не трогает).
#   bash scripts/sync-students.sh "текст коммита"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
MSG="${1:-Обновление монтажных паттернов}"
REMOTE=git@github.com:saint4ai/reels-pipline-automotaj.git
W="${TMPDIR:-/tmp}/students-sync-$$"
git fetch -q "$REMOTE" main
git worktree prune; git worktree add -q --detach "$W" FETCH_HEAD
copy(){ mkdir -p "$W/$(dirname "$1")"; cp -r "$ROOT/$1" "$W/$1"; }
LIST="CONTEXT.md AGENTS.md CLAUDE.md docs/rules-reconcile.md history/DECISIONS.md fonts/README.md scripts/hooks .claude/settings.json .claude/skills"
for f in $LIST; do [ -e "$ROOT/$f" ] && copy "$f"; done
for f in $(git ls-files knowledge docs/agent-contract scripts reference/breakdowns reference/transitions fonts videos/reels-1-composio | grep -vE '\.(ttf|otf|mp4)$|JOURNAL|00-analysis'); do copy "$f"; done
for f in $(git ls-files fonts | grep -E 'Variable\.ttf$'); do copy "$f"; done
cd "$W" && git add -A
if git diff --cached --quiet; then echo "нечего переносить"; else
  git commit -q -m "$MSG

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git push "$REMOTE" HEAD:main 2>&1 | tail -1
fi
cd "$ROOT" && git worktree remove --force "$W"
