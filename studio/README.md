# Студия: Remotion + Storybook

Здесь собираются все новые ролики: Remotion рендерит, Storybook показывает каждый блок отдельно.
Правила монтажа — навык `.claude/skills/remotion-montage`, порядок работы — `docs/agent-contract/WORKFLOW.md`.

## Установка (делает агент)

```bash
cd studio && npm ci && npx remotion browser ensure
```

`.npmrc` уже ставит `legacy-peer-deps` (Storybook рядом с Remotion без него не ставится).

## Команды

| Что | Команда (из `studio/`) |
|---|---|
| Студия Remotion — все композиции с перемоткой | `npm run studio` |
| Витрина Storybook | `npm run storybook` → http://localhost:6006 |
| Проверка типов | `npm run typecheck` |
| Кадры по номерам | `ENTRY=src/videos/<id>/index.tsx node scripts/stills.mjs <id> 0 120 240` |
| Листы кадров каждые 2 с (К001…) | `ENTRY=src/videos/<id>/index.tsx node scripts/review.mjs <id>` |
| Проверка контейнеров | `ENTRY=src/videos/<id>/index.tsx node scripts/qa-fit.mjs <id>` → `FIT PASS` |
| Проверка, что проверка жива | `node scripts/qa-fit.mjs FitTest` → обязан `FIT FAIL` |
| Рендер | `npx remotion render src/videos/<id>/index.tsx <id> ../videos/<id>/renders/raw.mp4` |
| Мастеринг звука −14 LUFS | `bash scripts/master.sh <raw.mp4> <final.mp4>` |
| Новый 3D-предмет | `node scripts/gen-object.mjs <name> "<промпт>"` (ключ в `OPENAI_API_KEY`) |

Новый ролик создаётся из корня репозитория: `bash scripts/new-video.sh <id> <reels|youtube> <запись.mp4>`.

## Что где

- `src/formats.ts` — два формата: рилс 1440×2560 и YouTube 2560×1440 (зона графики, три размера спикера, субтитры).
- `src/template/` — шаблон стиля КАНВАС: `Template.tsx`, блоки `hook / list / stat / logos / cta`, стол и пунктир, камера, курсор.
- `src/kit/` — библиотека: стекло с преломлением (`liquid/`), постер (`poster.tsx`), переходы сцен (`presentations.tsx`),
  3D (`three.tsx`), телефон, тогл, курсор, иллюминатор.
- `src/ds/` — глубина текста и панелей, токены, проверка контейнеров `useFit`.
- `src/montage/` — субтитры-капсула, чипы, логотипы, счётчики.
- `src/stories/` — витрина Storybook.
- `src/videos/<id>/` — ролики: `project.ts` (данные), `words.ts` (расшифровка), `index.tsx` (своя точка входа).
- `public/` — шрифты, звуки `sfx/`, логотипы `brand/`, предметы `objects/`; записи — `public/projects/<id>/` (не в git).

## Композиции в `src/index.ts`

`Template-Reels`, `Template-YouTube` — демо шаблона; `SceneKit` — переходы режима сцен; `StackSpreadDemo`; `FitTest`.
