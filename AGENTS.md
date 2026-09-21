# Reels Montage Pipeline — вход для Codex (то же, что CLAUDE.md для Claude Code)

**Владелец проекта.** Правила писались под автора, поэтому в них встречается «Александр». Если пользователь не Александр, «Александр» в правилах — это владелец проекта, то есть текущий пользователь: вопросы по формату, стилю и приёмке задавай ему. Новичку — `START.md`.

0. **Стек — Remotion + Storybook** в папке `studio/`. HyperFrames для новых роликов не используется (`docs/legacy-hyperframes.md`).
1. **Первое действие после установки и в любой сессии без конкретной задачи — опрос владельца** по `docs/agent-contract/WORKFLOW.md`:
   модель `gpt-5.6-sol` с `model_reasoning_effort = "xhigh"` (не ниже `"high"`) → **формат** (рилс или YouTube, картинка
   `reference/style-previews/formats.jpg`) → **стиль** (1–4 КАНВАС, СТЕКЛО, ПОСТЕР, СЦЕНЫ, паттерны 5–12 или свой; картинки
   `reference/style-previews/styles.jpg` и `more-styles.jpg`, каталог `patterns/README.md`) → вопросы по одному → текст с ресёрчем и тремя скептиками → монтаж → листы кадров → рендер.
   Рендер запрещён без `videos/<проект>/BRIEF.md` и `CONCEPT.md`.
2. Прочитай `CONTEXT.md` первым: команды студии, где что лежит, экономия подписки.
3. Правила монтажа, форматы, проверки и грабли: `.claude/skills/remotion-montage/SKILL.md` (в Codex навыки копирует
   `bash scripts/bootstrap-portable.sh --codex`).
4. Новый ролик: `bash scripts/new-video.sh <id> <reels|youtube> <запись.mp4>`; команды студии — `studio/README.md`.
5. Тексты: `knowledge/06_copywriting.md`; бренд и CTA: `knowledge/personal-brand-content-system.md`.
6. Правила поведения: `.claude/skills/karpathy-guidelines/SKILL.md` + `docs/agent-contract/KARPATHY-MONTAGE.md`.
