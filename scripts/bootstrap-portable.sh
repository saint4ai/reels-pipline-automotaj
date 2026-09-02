#!/usr/bin/env bash
set -euo pipefail

repo_root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_root_path="${CODEX_HOME:-$HOME/.codex}"
codex_skills_path="$codex_root_path/skills"

mkdir -p "$codex_skills_path"

for skill_name in onai-content-engine talking-head-recut; do
  source_path="$repo_root_path/.agents/skills/$skill_name"
  destination_path="$codex_skills_path/$skill_name"

  if [[ ! -d "$source_path" ]]; then
    echo "Repo-local skill not found: $source_path" >&2
    exit 1
  fi

  mkdir -p "$destination_path"
  cp -R "$source_path/." "$destination_path/"
  echo "Installed local skill: $skill_name"
done

if [[ "${1:-}" != "--skip-external-skills" ]]; then
  command -v npx >/dev/null 2>&1 || {
    echo 'npx is required to install external skills.' >&2
    exit 1
  }

  npx --yes skills@1.5.23 add coreyhaines31/marketingskills@e55de886fe7580ec75cdb7ded5092b33f7d4ed58 \
    --global --agent codex --copy --yes \
    --skill product-marketing customer-research content-strategy copywriting copy-editing social marketing-psychology analytics

  npx --yes skills@1.5.23 add robpalmer99/claude-code-copywriting-skills@7dbfd61e0f283ca09c20b3eca3657365e00e991d \
    --global --agent codex --copy --yes \
    --skill direct-response-copy copychief ad-copy
fi

echo "Portable ONai setup complete. Codex skills: $codex_skills_path"
