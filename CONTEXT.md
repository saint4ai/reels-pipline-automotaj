# Быстрый контекст

Читается первым, подключён через CLAUDE.md. Задача — не дать себя прочитать целиком.

## Что здесь

Вертикальные рилсы 1080×1920, 30 fps. Рендер — HyperFrames 0.8.20: HTML + CSS + GSAP прогоняется
headless-браузером в MP4. Всё локально, аккаунт HeyGen не нужен.

## Спрашивай, а не читай

```bash
python3 scripts/pipe.py state    <project>   # что есть, что устарело, что сломано: BOM, сеть, шрифты, план ↔ композиция
python3 scripts/pipe.py scenes   <project>   # сцены из позиций GSAP, медиа, спикер; неразобранное считается
python3 scripts/pipe.py captions <project>   # субтитры с таймингами
python3 scripts/pipe.py plan     <project>   # таймлайн, выведенный из storyboard.json, со стеками акцентов
python3 scripts/pipe.py validate <project>   # сториборд против DECISIONS и 03_rules: BLOCKING / ACTIONABLE / INFO
python3 scripts/pipe.py lint     <project>   # статический линтер: секунды, без Chrome
python3 scripts/pipe.py check    <project>   # полный check: lint + runtime + layout + motion + contrast (Chrome, минуты)
python3 scripts/pipe.py qa       <project>   # приёмка мастера: ffprobe против плана + contact sheet с safe-zone
python3 scripts/pipe.py build    <project>   # assemble → validate → lint → check → лист снимков, одной командой
python3 scripts/pipe.py plan     <project> --layout   # раскладка по секундам: спикер, доска, вставки, события
python3 scripts/transitions.py index         # чистые окна переходов по id; сториборд ссылается на id, не на источник
```

`scenes` + `captions` для vibecoding — 4 КБ вместо 96 КБ. Что не разобрано (позиции-выражения),
команда называет числом. `index.html` открывать кусками (Read с offset) и только когда правишь
разметку; хук `scripts/hooks/guard-reads.py` блокирует чтение целиком и говорит, чем заменить.

## Три закона фильтрации

1. **Потолок байт** у каждой команды, обрезка с явным маркером; строка длиннее 400 символов режется.
2. **Лестница важности.** `[BLOCKING]` печатается первым и целиком, `[ACTIONABLE]` одной строкой,
   `[INFO]` если влезло.
3. **Проекция, а не пересказ.** Всегда видно, чего не видно.

Законы действуют в pipe.py и в хуке. Остальные чтения — на твоей дисциплине.

## Ходы дороже байтов

Каждое сообщение с инструментом — полное перечитывание контекста. Независимые чтения и проверки
делаются одним сообщением, несколько вызовов сразу. Замер: 195 из 195 ходов сессии-монолита
содержали один вызов; батчинг снял бы пятую часть её стоимости.

## Сессии

Запуск: `bash scripts/session.sh <тип> [videos/<project>]` — ставит `--autocompact` и `--effort`.

| Тип | Вход → выход | effort | контекст |
|---|---|---|---|
| director | brief + transcript → storyboard.json + DIRECTION.md; композицию не собирает | high | ≤ 150k |
| build | `pipe.py build` → лист снимков → render-safe → qa; агент пишет только `parts/` по контракту | medium | ≤ 120k |
| review | contact sheet + замечания Александра → правки сториборда и DECISIONS.md | medium | ≤ 100k |
| research | по контракту в session.sh: ≤ 5 агентов, выход в reference/research/ и ≤ 2 КБ в knowledge/ | medium | ≤ 150k |

Контракт для любого агента (Codex, Opus, Claude): `docs/agent-contract/`. Сториборд по схеме 7 —
единственный вход сборщика; `parts/` — единственный рукописный HTML.
Состояние живёт только в файлах: storyboard.json, DIRECTION.md, DECISIONS.md. Замечание Александра
записывается в том же ходе, когда прозвучало. Сессию с контекстом больше 100k не оставлять висеть:
закрыть и начать новую от файлов.

## Рендер

Запускает агент фоновой задачей (`run_in_background: true`); харнесс сам разбудит по завершении:

```bash
bash scripts/render-safe.sh <project> renders/out.mp4 [--draft]
```

Внутри: lint до Chrome → render `--strict --quiet`, лог в `logs/render/` → проверка файла → qa.
Печатает не больше 15 строк:

```
RENDER OK  renders/out.mp4  44M  312s  quality=high
  QA out.mp4
    1080x1920 30fps 51.25s (план 51.25) audio aac 48000Hz 7.0 Мбит/с
    contact sheet (6 кадров, safe-zone поверх): videos/<project>/renders/qa/out-contact.jpg
    PASS
```

Коды: 0 OK · 2 lint не пропустил · 3 файла нет · 4 QA · иначе код рендера. При `--quiet` причина
падения в логе может отсутствовать, обёртка тогда подсказывает `pipe.py check`.
Прямой `npx hyperframes render` хук блокирует.

## По умолчанию не делать

- Не читать целиком `reference/clips-index.md` (147 КБ), `knowledge/01_catalog.md` (124 КБ),
  `SKILL.md` — только grep.
- Не смотреть кадры по одному: один contact sheet (~1500 токенов) вместо N кадров.
- Не запускать веера субагентов. Замерено: 34 агента = 6.3 млн экв., холодный старт каждого
  ~60k токенов. Два-три, только ради независимости суждения; агенту давать файл и вопрос,
  не репозиторий.
- В production-сессиях не читать README, SESSION_LOG, SETUP и `knowledge/04_pipeline.md`
  (эпоха Remotion).
- Не опрашивать рендер в цикле.

## Материалы

Упомянут сервис — его логотип и интерфейс берутся, а не рисуются по памяти. Каждый файл получает
запись в `ASSET_SOURCES.md` проекта. Правило: `knowledge/08_assets.md`. Переходы — только тримы из
`reference/transitions/trims/` по id окна; права на исходники не подтверждены (manifest.provenance).

## Порядок монтажа

Любой агент начинает с `docs/agent-contract/MONTAGE-RUNBOOK.md`; новый проект — `bash scripts/new-reel.sh <id>`.

## Дизайн-код

Единый облик всех рилсов — `knowledge/09_design_system.md` (токены, типографика, режимы раскладки, закон
наложений); полный технический пайплайн от исходников до приёмки — `knowledge/10_montage_pipeline.md`. Эталон реализации — `videos/reels-1-composio/parts/scenes.*` и `frame.md` проекта. Собирать «как
у Codex» по кадрам нельзя: токены берутся из CSS эталона, кадры — только для проверки.

## Что нельзя ломать

`history/DECISIONS.md` — утверждённый формат. `frame.md` проекта — палитра. `reference/platform-guides/`
— safe-zone и caption lanes. Меняется только с прямого слова Александра. Открытые противоречия
формата (лайм, шрифты, доска, отдых): `docs/rules-reconcile.md`; до ответа валидатор держит их на
уровне INFO/ACTIONABLE.

Константы: полоса субтитров по состоянию спикера — H (нижняя половина) `centerY=868`, T (портрет) `1272`,
полноэкранная карточка `1290`, подкаст на шве `960`; зазор до окна спикера ≥ 32 px. Зумы запрещены.

Решения Александра (подробно в DECISIONS.md): лайм `#B6FF00`; шрифты с 3 сентября 2026 — Manrope ExtraBold
(H1, H2, субтитры), Manrope Regular (вторичный), JetBrains Mono (техническая разметка), STIX Two Text Italic
(рукописный голос), Benzin Bold — запасной H1; файлы — `bash scripts/fonts.sh <project>`; субтитры три слова,
кегль 66, караоке-заливка, плашка со скруглением 16; исходники без кропа; спикер по умолчанию на всю нижнюю
половину, положение меняется не реже раза в 10 с; три формата — `knowledge/11_formats.md`, формат спрашивается
до сториборда; заставок нет — монтаж и субтитры с первого слова.
