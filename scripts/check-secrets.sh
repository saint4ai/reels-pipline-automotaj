#!/usr/bin/env bash
# Сторож секретов. Один скрипт на два места: хук перед коммитом и проверка в CI.
#   bash scripts/check-secrets.sh            # всё дерево под контролем git
#   bash scripts/check-secrets.sh --staged   # только то, что уходит в коммит
#   bash scripts/check-secrets.sh --history  # все ревизии (медленно, для разовой проверки)
# Выход 0 — чисто, 1 — найдено. Ложное срабатывание помечается в файле комментарием
# "allow-secret" в той же строке.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

PAT='sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|glpat-[A-Za-z0-9_-]{20,}|EAA[A-Za-z0-9]{60,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|hf_[A-Za-z0-9]{30,}|pplx-[A-Za-z0-9]{30,}|fc-[a-f0-9]{32}|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}|postgres(ql)?://[^ "'"'"']{16,}'
# имена файлов, которых в репозитории быть не должно (кроме .example)
BAD_NAMES='(^|/)\.env$|(^|/)\.env\.(local|prod|production)$|\.pem$|\.p12$|\.pfx$|(^|/)id_(rsa|ed25519|ecdsa)$|(^|/)credentials?\.json$|(^|/)cookies?\.(txt|json)$|\.session$'

mode="${1:---tree}"; fail=0

check_names() { # $1 — список путей
  local bad; bad=$(grep -nE "$BAD_NAMES" <<<"$1" || true)
  if [[ -n "$bad" ]]; then echo "НАЙДЕНО: файлы, которых не должно быть в репозитории:"; sed 's/^/  /' <<<"$bad"; fail=1; fi
}

case "$mode" in
  --staged)
    files=$(git diff --cached --name-only --diff-filter=ACM)
    [[ -z "$files" ]] && exit 0
    check_names "$files"
    hits=$(git diff --cached -U0 --diff-filter=ACM | grep -E '^\+' | grep -vE '^\+\+\+' | grep -nIE "$PAT" | grep -v 'allow-secret' || true)
    ;;
  --history)
    check_names "$(git ls-files)"
    hits=$(for c in $(git rev-list --all); do git grep -nIE "$PAT" "$c" 2>/dev/null; done | grep -v 'allow-secret' | sort -u || true)
    ;;
  *)
    check_names "$(git ls-files)"
    hits=$(git ls-files -z | xargs -0 grep -nIE "$PAT" 2>/dev/null | grep -v 'allow-secret' || true)
    ;;
esac

if [[ -n "${hits:-}" ]]; then
  echo "НАЙДЕНО: похоже на учётные данные —"
  # значение не печатаем целиком: только файл, строка и первые 12 знаков совпадения
  sed -E 's/(.{0,80}).*/\1…/' <<<"$hits" | head -20 | sed 's/^/  /'
  fail=1
fi

if [[ $fail -eq 0 ]]; then echo "секретов не найдено"; else
  cat <<'MSG'

Что делать: убрать значение из файла, положить его в переменную окружения.
Если ключ уже попадал в коммит — сначала отозвать и выпустить новый, чистка истории потом.
Ложное срабатывание — допишите в конце строки комментарий allow-secret.
MSG
fi
exit $fail
