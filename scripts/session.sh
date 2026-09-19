#!/usr/bin/env bash
# Запуск сессии Claude Code с потолком контекста и усилием под тип работы.
#
#   bash scripts/session.sh director|build|review|research [videos/<project>] [-- доп. флаги claude]
#
# Потолок контекста (--autocompact) выбран по замеру: медиана контекста сессии-монолита была 360k,
# при потолке 150k та же сессия стоила бы на 42% меньше. Усилие: режиссёр xhigh, остальные high — ниже high монтаж не вести
# (docs/agent-contract/WORKFLOW.md, этап 0).
set -euo pipefail
mode="${1:?director|build|review|research}"; shift || true
project=""
if [[ "${1:-}" != "" && "${1:-}" != "--" ]]; then project="$1"; shift; fi
[[ "${1:-}" == "--" ]] && shift
case "$mode" in
  director) effort=xhigh;  cap=150000
    task="Режиссёрская сессия. Вход: BRIEF.md, transcript.json, knowledge/03_rules.md §1–3, history/DECISIONS.md, knowledge/09_metaphors.md если есть. Выход: storyboard.json (машинный: пресеты по имени, окна переходов по id из reference/transitions/trims/index.json, у каждого события слово из транскрипта) и DIRECTION.md (почему). Проверка: python3 scripts/pipe.py validate <project>, потом pipe.py plan. Композицию не собирать.";;
  build)    effort=high;   cap=120000
    task="Сессия сборки. Начни с python3 scripts/pipe.py state <project>. Рукописный код — только parts/ по docs/agent-contract/PARTS-CONTRACT.md. Цикл: python3 scripts/pipe.py build <project> → посмотреть лист снимков → записать дефекты в DIRECTION.md → починить → снова build. Рендер только bash scripts/render-safe.sh фоном (run_in_background). Независимые чтения — одним сообщением. storyboard.json не менять без записи причины в DIRECTION.md.";;
  review)   effort=high;   cap=100000
    task="Сессия приёмки. Вход: renders/qa/*-contact.jpg и замечания Александра. Выход: правки storyboard.json через Edit, решения — в history/DECISIONS.md в том же ходе, когда прозвучали. Не рендерить.";;
  research) effort=high;   cap=150000
    task="Research-сессия. Сначала grep по history/ и reference/research/: отвеченное не исследовать. Не больше 5 агентов, у каждого схема ответа и веб-поиск, без доступа к репозиторию. Скептик только на утверждения, которые станут BLOCK-правилом или касаются лицензий. Выход: reference/research/<дата>-<тема>/findings.json + summary.md, и не больше 2 КБ в knowledge/.";;
  *) echo "режим: director|build|review|research" >&2; exit 2;;
esac
prompt="$task"
[[ -n "$project" ]] && prompt="${prompt} Проект: ${project}."
cd "$(dirname "${BASH_SOURCE[0]}")/.."
echo "claude --autocompact $cap --effort $effort   [$mode${project:+, $project}]" >&2
exec claude --autocompact "$cap" --effort "$effort" "$@" "$prompt"
