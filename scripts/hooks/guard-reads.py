#!/usr/bin/env python3
"""PreToolUse-хук: три закона фильтрации как механизм, а не как абзац.

Блокирует (exit 2, текст в stderr уходит агенту):
  - Read/cat/sed/head целиком по большим файлам (clips-index, 01_catalog, SKILL.md, index.html > 20 КБ)
    → вместо этого pipe.py scenes/captions или grep; кусок — Read с offset/limit.
  - hyperframes render мимо scripts/render-safe.sh.
Обход на один вызов: ALLOW_BIG_READ=1 в окружении команды. Отказ всегда объясняет, что делать.
"""
import json
import os
import re
import sys

BIG = [
    r"reference/clips-index\.md$",
    r"knowledge/01_catalog\.md$",
    r"skills/[^/]+/SKILL\.md$",
    r"\.agents/skills/.*/SKILL\.md$",
    r"history/SESSION_LOG\.md$",
]
HTML = r"videos/[^/\s'\"]+/(?:public/)?index\.html$"
HTML_LIMIT = 20_000


def deny(msg: str) -> None:
    sys.stderr.write(msg + "\n")
    sys.exit(2)


def main() -> None:
    try:
        d = json.load(sys.stdin)
    except Exception:  # noqa: BLE001
        sys.exit(0)
    if os.environ.get("ALLOW_BIG_READ") == "1":
        sys.exit(0)
    tool = d.get("tool_name", "")
    inp = d.get("tool_input") or {}
    if tool == "Read":
        p = str(inp.get("file_path", ""))
        if any(re.search(b, p) for b in BIG):
            deny(f"Файл {os.path.basename(p)} не читаем целиком: grep по конкретному запросу. Обход: ALLOW_BIG_READ=1.")
        if re.search(HTML, p) and not (inp.get("offset") or inp.get("limit")):
            try:
                size = os.path.getsize(p)
            except OSError:
                size = 0
            if size > HTML_LIMIT:
                deny(f"index.html ({size} байт) целиком не читаем: python3 scripts/pipe.py scenes|captions <project>; "
                     "кусок — Read с offset/limit. Обход: ALLOW_BIG_READ=1.")
    elif tool == "Bash":
        c = str(inp.get("command", ""))
        if "ALLOW_BIG_READ=1" in c:
            sys.exit(0)
        if re.search(r"\bhyperframes\s+render\b", c) and "render-safe.sh" not in c:
            deny("Рендер только через bash scripts/render-safe.sh <project> [out.mp4] (фоном). Он сам ставит --quiet, лог в logs/, QA после.")
        big_any = "|".join(BIG + [HTML])
        if re.search(r"\b(cat|less|more|sed\s+-n\s+'?1,\$|head\s+-c\s+[0-9]{6,})\b[^|;&]*(" + big_any + ")", c):
            deny("Большой файл целиком не читаем: pipe.py scenes/captions, либо grep -n по запросу, либо sed -n 'A,Bp' на ≤ 120 строк. Обход: ALLOW_BIG_READ=1.")
    sys.exit(0)


if __name__ == "__main__":
    main()
