---
name: reel-workflow
description: Use at the start of every new Reel in this repository (new video, new script, «смонтируй», «новый рилс», a recording path) — before any montage, research or rendering. Runs the owner interview step by step (topic, script, recording, montage format, screenshots/materials, references, delivery), writes the script with research and three skeptics when needed, checks the model and reasoning effort, and only then starts the montage runbook.
---

# Этапы работы над рилсом

Полный порядок — `docs/agent-contract/WORKFLOW.md`. Читать его целиком перед первым вопросом владельцу.

1. **Модель и усилие.** Claude Code — самая новая Opus, усилие xhigh (не ниже high); Codex — `gpt-5.6-sol`,
   `model_reasoning_effort` xhigh (не ниже high). Слабее — сказать владельцу первым сообщением.
2. **Опрос по одному вопросу** ⏸: о чём и зачем → текст есть? → запись есть? → формат монтажа (`knowledge/11_formats.md`) →
   скриншоты и материалы → референсы → как сдать. Ответы — в `videos/<проект>/BRIEF.md`, подтверждение владельца.
3. **Текст** ⏸ (если нужен): ресёрч с источниками → черновик по `knowledge/06_copywriting.md` → три скептика
   (эксперт-зритель, копирайтер прямого отклика, редактор удержания; каждый получает только текст и факты) →
   сверка утверждений → финальный текст владельцу.
4. **Запись и материалы** → **монтаж** по `docs/agent-contract/MONTAGE-RUNBOOK.md` → **кадры** ⏸ → **рендер**.

Не начинать монтаж до заполненного брифа. Не выдумывать чисел. Ничего не ставить владельцу в терминал — ставит агент.
