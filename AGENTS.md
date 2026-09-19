# Reels Montage Pipeline — вход для Codex (то же, что CLAUDE.md для Claude Code)

**Владелец проекта.** Правила писались под автора, поэтому в них встречается «Александр». Если пользователь не Александр, «Александр» в правилах — это владелец проекта, то есть текущий пользователь: вопросы по формату, стилю и приёмке задавай ему. Новичку — `START.md`.

0. **Новый ролик начинается с опроса владельца** — `docs/agent-contract/WORKFLOW.md`: модель `gpt-5.6-sol` с `model_reasoning_effort = "xhigh"` (не ниже `"high"`) → опрос по одному вопросу → текст с ресёрчем и тремя скептиками → монтаж → кадры → рендер.
1. Прочитай `CONTEXT.md` первым: команды проекций, три закона фильтрации, типы сессий, рендер.
2. Контракт монтажа для любого агента: `docs/agent-contract/` — `STORYBOARD-SCHEMA.md` (что пишет
   режиссёр), `PARTS-CONTRACT.md` (единственный HTML, который пишет агент), `00-analysis.md` (почему так).
3. Формат утверждён в `history/DECISIONS.md`; менять только со слов Александра.
4. Бренд, форматы, CTA: `knowledge/personal-brand-content-system.md` — читать в режиссёрской сессии.
5. Цикл сборки одной командой: `python3 scripts/pipe.py build videos/<project>`; рендер только
   `bash scripts/render-safe.sh videos/<project> renders/out.mp4`.

Скилл HyperFrames `talking-head-recut` лежит в `.claude/skills/talking-head-recut` и общий для Codex и Claude Code (в Codex его копирует `bash scripts/bootstrap-portable.sh --codex`), форков под конкретную модель нет.
6. Дизайн-код всех рилсов: `knowledge/09_design_system.md`; эталон — `videos/reels-1-composio/parts/`.
7. Порядок работы шаг за шагом: `docs/agent-contract/MONTAGE-RUNBOOK.md`; новый проект — `bash scripts/new-reel.sh <id>`.

8. Правила поведения: `.claude/skills/karpathy-guidelines/SKILL.md` + `docs/agent-contract/KARPATHY-MONTAGE.md` (ворота фаз и бюджеты токенов).
