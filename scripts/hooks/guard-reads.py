#!/usr/bin/env python3
"""PreToolUse-хук: три закона фильтрации как механизм, а не как абзац.

Блокирует (exit 2, текст в stderr уходит агенту):
  - Read/cat/sed/head целиком по большим файлам (clips-index, 01_catalog, чужие SKILL.md)
    → вместо этого grep по запросу; кусок — Read с offset/limit.
Свои навыки монтажа (.claude/skills/remotion-montage, reel-workflow) читаются целиком.
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
        # свои навыки монтажа читаются целиком — это рабочие инструкции, а не справочник
        if re.search(r"\.claude/skills/(remotion-montage|reel-workflow)/SKILL\.md$", p):
            sys.exit(0)
        if any(re.search(b, p) for b in BIG):
            deny(f"Файл {os.path.basename(p)} не читаем целиком: grep по конкретному запросу. Обход: ALLOW_BIG_READ=1.")
    elif tool == "Bash":
        c = str(inp.get("command", ""))
        if "ALLOW_BIG_READ=1" in c:
            sys.exit(0)
        big_any = "|".join(BIG)
        if re.search(r"\b(cat|less|more|sed\s+-n\s+'?1,\$|head\s+-c\s+[0-9]{6,})\b[^|;&]*(" + big_any + ")", c):
            deny("Большой файл целиком не читаем: grep -n по запросу или sed -n 'A,Bp' на ≤ 120 строк. Обход: ALLOW_BIG_READ=1.")
    sys.exit(0)


if __name__ == "__main__":
    main()
