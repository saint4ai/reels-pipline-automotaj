#!/usr/bin/env bash
# Ставит хук, который проверяет коммит на секреты до его создания.
#   bash scripts/hooks/install.sh
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
install -m 755 "$root/scripts/hooks/pre-commit" "$root/.git/hooks/pre-commit"
echo "хук поставлен: .git/hooks/pre-commit"
