---
name: reel-workflow
description: Use at the start of every new video in this repository (new Reel or YouTube video, new script, «смонтируй», «новый рилс», «ролик для ютуба», a recording path) — before any montage, research or rendering. Asks the format first (Reels 9:16 or YouTube 16:9) with the formats picture, then the montage style with the styles picture, then the owner interview one question at a time, writes the script with research and three skeptics when needed, and only then starts the Remotion montage.
---

# Этапы работы над роликом

Полный порядок — `docs/agent-contract/WORKFLOW.md`. Прочитать его перед первым вопросом владельцу.

1. **Модель и усилие.** Claude Code — самая новая Opus, xhigh (не ниже high); Codex — `gpt-5.6-sol`, xhigh. Слабее — сказать сразу.
2. **Формат** ⏸ — картинка `reference/style-previews/formats.jpg` в чат: рилс 9:16 или YouTube 16:9.
3. **Стиль** ⏸ — картинка `reference/style-previews/styles.jpg`: КАНВАС, СТЕКЛО, ПОСТЕР, СЦЕНЫ или свой
   (`knowledge/montage-concepts.md`). Выбор — в `videos/<проект>/CONCEPT.md`.
4. **Опрос по одному вопросу** ⏸: о чём и зачем → текст → запись → материалы → референсы → как сдать. Бриф — `BRIEF.md`.
5. **Текст** ⏸ (если нужен): ресёрч с источниками → черновик по `knowledge/06_copywriting.md` → три скептика → финал владельцу.
6. **Монтаж** на Remotion по навыку `remotion-montage`: `bash scripts/new-video.sh` → карта монтажа → блоки и Storybook →
   qa-fit → кадры ⏸ → рендер → мастеринг.

Не начинать монтаж без брифа и концепции. Не выдумывать чисел. Ничего не ставить владельцу в терминал — ставит агент.
