# Быстрый контекст

Читается первым, подключён через CLAUDE.md.

## Что здесь

Монтаж роликов с агентом: **рилсы 9:16** (1440×2560) и **ролики для YouTube 16:9** (2560×1440), 60 fps, 48 Мбит/с.
Рендер — **Remotion** (React-компоненты, анимация от номера кадра), витрина блоков — **Storybook**. Всё локально, в папке `studio/`.

## Порядок

`docs/agent-contract/WORKFLOW.md`: модель → формат ⏸ → стиль ⏸ → опрос ⏸ → текст ⏸ → `bash scripts/new-video.sh` →
карта монтажа (`videos/<id>/DIRECTION.md`) → блоки в `studio/src/videos/<id>/` + истории Storybook → qa-fit →
листы кадров ⏸ → рендер → мастеринг. Правила кадра и грабли — навык `.claude/skills/remotion-montage`.

## Команды (из `studio/`)

```bash
npm run studio                                                    # студия Remotion
npm run storybook                                                 # витрина блоков
npm run typecheck                                                 # типы
ENTRY=src/videos/<id>/index.tsx node scripts/qa-fit.mjs <id>      # контейнеры → FIT PASS
node scripts/qa-fit.mjs FitTest                                   # обязан FIT FAIL
ENTRY=src/videos/<id>/index.tsx node scripts/review.mjs <id>      # листы кадров каждые 2 с
npx remotion render src/videos/<id>/index.tsx <id> ../videos/<id>/renders/raw.mp4
bash scripts/master.sh ../videos/<id>/renders/raw.mp4 ../videos/<id>/renders/final.mp4
```

Рендер — фоновой задачей (`run_in_background: true`), харнесс сам разбудит. Не опрашивать рендер в цикле.

## Где что

| Что | Где |
|---|---|
| Форматы и раскладка | `studio/src/formats.ts` |
| Стили и картинки выбора | `knowledge/montage-concepts.md`, `reference/style-previews/{formats,styles}.jpg` |
| Шаблон КАНВАС | `studio/src/template/` |
| Библиотека блоков | `studio/src/kit/`, `studio/src/ds/`, `studio/src/montage/` |
| Шрифты, звуки, логотипы, предметы | `studio/public/{fonts,sfx,brand,objects}` |
| Проект ролика | `videos/<id>/` (BRIEF, CONCEPT, SCRIPT, DIRECTION, DECISIONS, assets, renders) |
| Код ролика | `studio/src/videos/<id>/` |

## Экономия подписки

- Кадры — только листами (`review.mjs`, `scripts/sheet.sh`), не по одному.
- Независимые чтения и проверки — одним сообщением, несколько вызовов сразу.
- Веера субагентов не запускать: два-три агента только ради независимости суждения (скептики текста).
- Один ролик — одна сессия; длинную сессию закрыть и начать новую от файлов проекта.

## Материалы

Упомянут сервис — его настоящий логотип и интерфейс, не рисунок по памяти; каждый файл — строкой в `videos/<id>/ASSET_SOURCES.md`.
Чисел, которых нет в материалах владельца, не выдумывать. Ничего не ставить владельцу в терминал: ставит агент, владельцу — только
регистрация, оплата, ключи и разрешения.
