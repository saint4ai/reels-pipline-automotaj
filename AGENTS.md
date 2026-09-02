# Reels Montage Pipeline — вход для Codex (то же, что CLAUDE.md для Claude Code)

1. Прочитай `CONTEXT.md` первым: команды проекций, три закона фильтрации, типы сессий, рендер.
2. Контракт монтажа для любого агента: `docs/agent-contract/` — `STORYBOARD-SCHEMA.md` (что пишет
   режиссёр), `PARTS-CONTRACT.md` (единственный HTML, который пишет агент), `00-analysis.md` (почему так).
3. Формат утверждён в `history/DECISIONS.md`; менять только со слов Александра.
4. Бренд, форматы, CTA: `knowledge/personal-brand-content-system.md` — читать в режиссёрской сессии.
5. Цикл сборки одной командой: `python3 scripts/pipe.py build videos/<project>`; рендер только
   `bash scripts/render-safe.sh videos/<project> renders/out.mp4`.

Скилл HyperFrames `talking-head-recut` общий для Codex и Claude Code, форков под конкретную модель нет.
6. Дизайн-код всех рилсов: `knowledge/09_design_system.md`; эталон — `videos/reels-1-composio/parts/`.
7. Порядок работы шаг за шагом: `docs/agent-contract/MONTAGE-RUNBOOK.md`; новый проект — `bash scripts/new-reel.sh <id>`.
\n8. Правила поведения: `.claude/skills/karpathy-guidelines/SKILL.md` + `docs/agent-contract/KARPATHY-MONTAGE.md` (ворота фаз и бюджеты токенов).\n