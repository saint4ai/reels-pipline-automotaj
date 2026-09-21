#!/usr/bin/env bash
# Запуск сессии Claude Code с потолком контекста и усилием под тип работы.
#
#   bash scripts/session.sh director|build|review|research [videos/<project>] [-- доп. флаги claude]
#
# Потолок контекста (--autocompact) выбран по замеру: медиана контекста сессии-монолита была 360k,
# при потолке 150k та же сессия стоила бы на 42% меньше. Усилие: монтаж — xhigh на всех этапах, ниже high не вести
# (docs/agent-contract/WORKFLOW.md, этап 0).
set -euo pipefail
mode="${1:?director|build|review|research}"; shift || true
project=""
if [[ "${1:-}" != "" && "${1:-}" != "--" ]]; then project="$1"; shift; fi
[[ "${1:-}" == "--" ]] && shift
case "$mode" in
  director) effort=xhigh;  cap=150000
    task="Режиссёрская сессия. Вход: videos/<project>/BRIEF.md, CONCEPT.md, transcript.json, knowledge/03_rules.md, patterns/styles/<стиль>/PATTERN.md выбранного стиля. Выход: videos/<project>/DIRECTION.md — карта монтажа: время → фраза → фон → что на экране → механика → стык и его причина → размер карточки спикера. Код не писать.";;
  build)    effort=xhigh;  cap=120000
    task="Сессия сборки на Remotion по .claude/skills/remotion-montage. Код ролика — только studio/src/videos/<project>/. Цикл: npm run typecheck → ENTRY=src/videos/<project>/index.tsx node scripts/qa-fit.mjs <project> → review.mjs → посмотреть листы → записать дефекты в DIRECTION.md → починить. Рендер — фоновой задачей, после — scripts/master.sh. Независимые чтения — одним сообщением.";;
  review)   effort=xhigh;  cap=100000
    task="Сессия приёмки. Вход: листы кадров out/review/<project>-sheet-*.jpg и замечания владельца. Выход: правки кода ролика, решения — в videos/<project>/DECISIONS.md в том же ходе, когда прозвучали. Не рендерить без «да».";;
  research) effort=high;   cap=150000
    task="Research-сессия. Не больше 5 агентов, у каждого схема ответа и веб-поиск, без доступа к репозиторию. Выход: reference/research/<дата>-<тема>/summary.md и не больше 2 КБ в knowledge/.";;
  *) echo "режим: director|build|review|research" >&2; exit 2;;
esac
prompt="$task"
[[ -n "$project" ]] && prompt="${prompt} Проект: ${project}."
cd "$(dirname "${BASH_SOURCE[0]}")/.."
echo "claude --autocompact $cap --effort $effort   [$mode${project:+, $project}]" >&2
exec claude --autocompact "$cap" --effort "$effort" "$@" "$prompt"
