# HyperFrames — прошлый стек (история)

До 21 сентября 2026 ролики этого репозитория собирались на HyperFrames 0.8.20 (HTML + CSS + GSAP → MP4), 1080×1920, 30 fps.
Новые ролики собираются только на Remotion + Storybook (`studio/`, навык `.claude/skills/remotion-montage`).

Что осталось от старого стека и зачем:

| Файл | Для чего |
|---|---|
| `scripts/pipe.py`, `scripts/render-safe.sh`, `scripts/new-reel.sh`, `scripts/prepare-media.sh` | досборка и перерендер старых HyperFrames-проектов |
| `videos/reels-1-composio/` | эталон старого формата |
| `docs/agent-contract/{MONTAGE-RUNBOOK,PARTS-CONTRACT,STORYBOARD-SCHEMA}.md` | контракт старой сборки по сториборду |
| `knowledge/09_design_system.md`, `knowledge/10_montage_pipeline.md`, `knowledge/11_formats.md` | раскладки и токены 1080×1920 старого формата |
| `reference/style-previews/four-styles.png` | кадры старых стилей PRISM, ORBIT, TRACE, PULSE |

Из HyperFrames в новом пайплайне используется только распознавание речи: `npx hyperframes@0.8.20 transcribe` (локальный whisper)
внутри `scripts/new-video.sh`. Рендер, раскладка и проверки — Remotion.

Методика экономии токенов (замеры, «агент спрашивает, а не читает», потолки вывода) описана в `docs/checklist.md` и работает
для любого стека.
