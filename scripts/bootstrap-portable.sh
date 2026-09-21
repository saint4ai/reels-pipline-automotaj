#!/usr/bin/env bash
# Подготовка репозитория на новой машине (WSL / macOS / Linux).
#   bash scripts/bootstrap-portable.sh [--codex] [--with-external-skills]
# Проверяет инструменты, ставит студию (Remotion + Storybook) и браузер рендера, сторож секретов перед коммитом.
# Навыки для Claude Code уже лежат в .claude/skills и подхватываются сами; --codex копирует их в Codex.
set -euo pipefail

repo_root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
with_codex=0; with_external=0
for arg in "$@"; do
  case "$arg" in
    --codex) with_codex=1 ;;
    --with-external-skills) with_external=1; with_codex=1 ;;
    --skip-external-skills) ;;  # старый ключ: внешние навыки и так не ставятся без --with-external-skills
    *) echo "неизвестный ключ: $arg" >&2; exit 2 ;;
  esac
done

missing=()
check() { command -v "$1" >/dev/null 2>&1 && echo "ok   $1" || { echo "нет  $1 — $2"; missing+=("$1"); }; }
check node    "нужен Node.js 22 или новее"
check npx     "идёт вместе с Node.js"
check ffmpeg  "нужен для записи, расшифровки и мастеринга звука"
check ffprobe "идёт вместе с ffmpeg"
check python3 "нужен Python 3.10 или новее"
if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$major" -ge 22 ]] || { echo "нет  node ≥ 22 — сейчас $(node -v)"; missing+=("node22"); }
fi

if [[ -d "$repo_root_path/.git" ]]; then
  bash "$repo_root_path/scripts/hooks/install.sh"
fi

echo "Claude Code: навыки уже в .claude/skills ($(ls "$repo_root_path/.claude/skills" | tr '\n' ' '))"

if [[ "$with_codex" == 1 ]]; then
  codex_skills_path="${CODEX_HOME:-$HOME/.codex}/skills"
  mkdir -p "$codex_skills_path"
  for skill_path in "$repo_root_path"/.claude/skills/*/; do
    name="$(basename "$skill_path")"
    mkdir -p "$codex_skills_path/$name"
    cp -R "$skill_path." "$codex_skills_path/$name/"
    echo "Codex: навык $name"
  done
fi

if [[ "$with_external" == 1 ]]; then
  npx --yes skills@1.5.23 add coreyhaines31/marketingskills@e55de886fe7580ec75cdb7ded5092b33f7d4ed58 \
    --global --agent codex --copy --yes \
    --skill product-marketing customer-research content-strategy copywriting copy-editing social marketing-psychology analytics
  npx --yes skills@1.5.23 add robpalmer99/claude-code-copywriting-skills@7dbfd61e0f283ca09c20b3eca3657365e00e991d \
    --global --agent codex --copy --yes \
    --skill direct-response-copy copychief ad-copy
fi

if [[ ${#missing[@]} -eq 0 ]]; then
  echo "Студия: зависимости Remotion + Storybook"
  (cd "$repo_root_path/studio" && npm ci --no-audit --no-fund && npx remotion browser ensure)
  (cd "$repo_root_path/studio" && npx tsc --noEmit) && echo "ok   студия: типы сходятся"
  echo "Готово. Дальше: опрос владельца по docs/agent-contract/WORKFLOW.md (формат → стиль → вопросы по одному)."
  echo "Новый ролик: bash scripts/new-video.sh <id> <reels|youtube> <запись.mp4>"
else
  echo "Не хватает: ${missing[*]}. Попроси Claude поставить их и запусти bootstrap ещё раз." >&2
  exit 1
fi
