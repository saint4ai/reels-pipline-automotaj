# Переносимость 5 Remotion-библиотек в HyperFrames (HTML + CSS + GSAP, без React)

Дата: 2026-09-03. Проверено по официальным страницам, GitHub API, npm registry, машинным реестрам (`registry.json`, `llms.txt`, `components.json`).
Сравнение сделано с локальным реестром HyperFrames: 378 строк каталога (374 имени: блоки + компоненты).

---

## 0. Главный вывод в двух строках

**Ни одна из пяти библиотек не переносится как код.** Все пять — React/JSX поверх Remotion, где анимация = чистая функция `useCurrentFrame()`. У HyperFrames другая модель: одна paused GSAP-таймлиния + seek. Переписывать компонент = писать заново.

**Переносится не код, а числа и словари.** Реально ценного — три вещи: (1) числовые токены движения Onda и RemotionUI, (2) 8 кривых easing из remotion-scenes, (3) таксономии — 18 переходов Onda, 16 категорий / 201 сцена remotion-scenes, 224 позиции RemotionUI, 100 семейств ali-abassi. Это даёт список пробелов в реестре HyperFrames — он в §7.

---

## 1. Сводная таблица

| Библиотека | На чём | Установка | Лицензия | Что берём без переписывания | Verdict |
|---|---|---|---|---|---|
| **degueba/onda** (remotion.onda.video) | React 18 + TS strict + Remotion 4.x, Zod-схемы | `npx ondajs add fade-in` (копирует исходник) или jsrepo/shadcn-манифест | **MIT** (код). Имя, wordmark, wave-логотип — вне MIT | Числовые токены `lib/motion.ts` + `lib/tokens.ts`, таксономия 18 переходов, 8 категорий, правило «accent earned» | **берём частично** |
| **RemotionUI** (remotionui.com, riaz37/remotion-ui) | React + TS + Remotion, registry-first CLI | `npx remotion-ui@latest add <name>` | **MIT** | `motion-tokens.ts` / `springs.ts` / `timing.ts` (числа), словарь 224 позиций — самый широкий чек-лист пробелов | **берём частично** |
| **av/remotion-bits** | React + TS + Remotion 4 + three.js, MCP-сервер | `npm i remotion-bits`, `npx jsrepo add`, `npx remotion-bits mcp` | **MIT** (в `package.json` и на npm; файла `LICENSE` в репо нет) | Модель декларативной системы частиц (spawner + behaviors), Scene3D step-камера, идея Oklch-интерполяции цвета | **берём частично** |
| **lifeprompt-team/remotion-scenes** | React + TS + Remotion 4 | `npx degit lifeprompt-team/remotion-scenes` (или отдельную папку категории) | **MIT** | `src/common/easing.ts` — 8 bezier как чистые числа; `colors.ts`; таксономия 16 категорий / 201 сцены (33 дизайн-темы, 22 роллера, 10 liquid) | **берём** (как словарь + кривые) |
| **ali-abassi/remotion-templates** | React + TS + Remotion, 100 family-движков → 1000 пресетов | `git clone` + `npm install` (сайт в `site/`) | **лицензии нет** — GitHub API `license: None`, `package.json` `license: None`, файла `LICENSE` нет ⇒ все права защищены | Только структура: 100 имён семейств + `registry.json` с числами (fps, durationInFrames, beatMarkers). Код и файлы `research/*-steal-list.md` — не трогать | **не берём** |

### Ловушка с Onda
`onda.video` и `remotion.onda.video` — **разные продукты**:
- `remotion.onda.video` → `github.com/degueba/onda` → React-компоненты для Remotion, **MIT**, 70 компонентов + 18 переходов. Это то, что в задаче.
- `onda.video` → `github.com/onda-engine/onda-engine` → Rust GPU-движок, авторинг в React, лицензия **FSL-1.1-Apache-2.0** (source-available, Apache-2.0 через 2 года), заявлено 80+ компонентов / 21 переход / 17 эффектов. Другая лицензия, другая кодовая база. Не путать.

---

## 2. Onda: таксономия переходов по энергии — проверка заявления

**Официальной таксономии Calm / Geometric / Accent в документации Onda НЕТ.** Проверено:
- `registry/registry.json` (88 позиций) — поля только `name, type, title, description, categories, dependencies`. Поля `energy` / `register` / `group` нет вообще.
- `llms.txt` и `llms-full.txt` — группировка по 8 категориям: `entrances, graphics, interface, data, scenes, cinematic, media, atmosphere` + `transitions`. Групп по энергии нет.
- Страницы `/components` и `/docs`, `docs/motion-language.md`, `docs/design-philosophy.md`, `CLAUDE.md` — слова `calm` и `accent` встречаются только как проза в описаниях. Слово `geometric` встречается один раз и в другом смысле: `Clash Display` — «characterful geometric».

Что в документации есть на самом деле:
- **`accent` как регистр** — упомянут один раз, для `zoom`: *«The catalog's lone 'accent' register; use sparingly so it stays a punctuation moment»*.
- **Calm — это дефолт всей библиотеки, а не группа**: `CLAUDE.md` §«Calm is the default, not the ceiling… the catalog spans the full range, from calm to high-energy».

Поэтому ниже — **таблица из официальных названий и официальных описаний**, а колонка «регистр» выведена из формулировок самой документации (`calm` / `high-energy` / `punctuation` / `most aggressive` / `accent register`). Это реконструкция, а не цитата таксономии.

### 18 переходов Onda (официальные имена, полный список)

| Имя (экспорт) | slug | Регистр по формулировке доков | Механика (официальное описание, сжато) | Происхождение |
|---|---|---|---|---|
| `crossFade` | `cross-fade` | **Calm** | Кроссфейд по opacity на house-easing `cubic-bezier(0.16, 1, 0.3, 1)`, 18 кадров | обёртка Remotion `fade()` |
| `morph` | `morph` | **Calm** | Кроссфейд + синхронный масштаб: уходящая 1 → 1.04, входящая 0.96 → 1. «Определяющий premium-переход» | Onda-original |
| `blur` | `blur` | **Calm** | Уходящая размывается и гаснет, входящая проявляется из блюра. Продолжение отпечатка `BlurReveal` | Onda-original |
| `dipToColor` | `dip-to-color` | **Calm** | Классика монтажной: уход в плашку цвета и выход из неё. Дефолт `--onda-bg` `#08080A`; `'#000'` / `'#fff'` для dip-to-black/white | Onda-original |
| `glassWipe` | `glass-wipe` | **Calm** | Входящая выезжает за кромкой frosted-glass, которая к концу «резчает»; уходящая заматовывается под ней | Onda-original |
| `slide` | `slide` | **Geometric** | Движется только входящая, уходящая стоит. Направления `left/right/up/down` | обёртка Remotion `slide()` |
| `push` | `push` | **Geometric** | Обе сцены едут вместе в одну сторону, как панорама камеры | Onda-original |
| `wipe` | `wipe` | **Geometric** | Жёсткая кромка от края к краю. Диагонали намеренно исключены | обёртка Remotion `wipe()` |
| `clockWipe` | `clock-wipe` | **Geometric** | Кромка вращается вокруг центра как часовая стрелка. Требует `width` + `height` | обёртка Remotion `clockWipe()` |
| `iris` | `iris` | **Geometric** | Круговая раскрытие/схлопывание от центра, как затвор. Требует `width` + `height` | обёртка Remotion `iris()` |
| `flip` | `flip` | **Geometric** | 3D card-flip: уходящая отворачивается, входящая доворачивается. Настраиваемый `perspective` | обёртка Remotion `flip()` |
| `depthPush` | `depth-push` | **Geometric** | Push с параллакс-масштабом: уходящая уменьшается, входящая приходит из чуть большего. «Signature multi-scene move», читается как долли | Onda-original |
| `expandMorph` | `expand-morph` | **Geometric** | Скруглённая карточка стартует из origin-rect уходящей сцены и раскрывается в фуллскрин, интерполируя позицию, размер и радиус вместе. Без овершута | Onda-original |
| `devicePullback` | `device-pullback` | **Geometric** | Уходящая — full-bleed UI в увеличении, отъезжает к 1x, вокруг дорисовывается минимальный безель (laptop/phone) | Onda-original |
| `zoom` | `zoom` | **Accent** | Масштабный punch, `'in'` / `'out'`. Прямая цитата доков: «единственный accent-регистр каталога, использовать редко» | Onda-original |
| `chromaticAberration` | `chromatic-aberration` | **Accent** | Разрыв на red/cyan и схлопывание обратно. «Самый агрессивный переход каталога; знак пунктуации, не дефолт» | Onda-original |
| `gridPixelate` | `grid-pixelate` | **Accent** | Сцена рассыпается в сетку ячеек в seeded-разбросе, детерминированный порядок. «Retro, high-energy cut» | Onda-original |
| `typeMask` | `type-mask` | **Accent** | Гигантское слово держится, затем экспоненциально масштабируется, пока внутренние просветы букв не выйдут за края кадра — входящая сцена видна сквозь типографику | Onda-original |

Разбивка: **Calm 5 · Geometric 9 · Accent 4.** 11 из 18 — Onda-original, 7 — обёртки над штатными presentation-функциями Remotion.

---

## 3. Числовые токены — то, что копируется буквально

### Onda (`lib/motion.ts`, `lib/tokens.ts`, MIT)
Числа заданы под 30 fps. Пересчёт на другой fps в самой библиотеке: `Math.round(DURATION.x * fps / 30)`.

```
DURATION (кадры @30fps)  instant 6 (0.20s) · fast 10 (0.33s) · base 18 (0.60s)
                         slow 24 (0.80s) · slower 30 (1.00s) · hold 45 (1.50s)
STAGGER                  4 кадра (≈0.13s) — одно значение на весь каталог
OVERSHOOT                0.03 (3% бампа масштаба, только для two-phase heroReveal)
SPRING_SMOOTH            damping 200, stiffness 100, mass 1   (демпфирование ≈10, без овершута)
SPRING_SNAPPY            damping 120, stiffness 180, mass 1   (быстрее, тоже без овершута)
HOUSE_EASE               cubic-bezier(0.16, 1, 0.3, 1)
SHUTTER (motion blur)    angle 180°, samples 10
Палитра                  bg #08080A · surface #0E0E12 · surface2 #121217
                         border #1C1C22 · borderLit #26262E
                         text #F2F2F4 · dim #8E8E98 · faint #56565F
                         accent #D96B82 · accentSoft #E89AAB
Шрифты                   display "Clash Display" · body "Space Grotesk"
Spacing                  [8, 16, 24, 32, 48, 64, 80, 100]
SAFE_MARGIN_RATIO        0.1 (10% на сторону)
```
Правило движения из доков: входы 18–28 кадров (0.6–0.95s); «никогда не reduce damping ниже critical, чтобы сфальсифицировать pop — вместо этого поднимать stiffness».
Отдельно: **motion-токены намеренно НЕ выведены в CSS-переменные**, только цвет и типографика (`--onda-*`). Мотивация в комментарии `tokens.ts`: движение — подпись, а не настройка.

### RemotionUI (`lib/motion-tokens.ts`, `lib/springs.ts`, `lib/timing.ts`, MIT)
```
DEFAULT_FPS   30
DURATION      fast 0.4s (12f) · normal 0.8s (24f) · slow 1.2s (36f)
DELAY         none 0 · short 0.15s (5f) · medium 0.3s (9f)
STAGGER       tight 4 · normal 8 · relaxed 12 (кадры)
EMPHASIS      subtle 1.05 (акцент внутри строки) · medium 1.10 (элемент на своей строке)
              strong 1.18 (hero-бит, максимум один на сцену)
EASING.enter  cubic-bezier(0.16, 1, 0.3, 1)
EASING.exit   Easing.in(Easing.cubic)     — «никогда не ease-out на выходе»
EASING.editorial cubic-bezier(0.45, 0, 0.55, 1)
EASING.pop    cubic-bezier(0.34, 1.56, 0.64, 1)
springSmooth  damping 200, mass 1,   stiffness 100, overshootClamping true
springSnappy  damping 20,  mass 0.8, stiffness 200, overshootClamping true
springBouncy  damping 12,  mass 0.9, stiffness 180, overshootClamping false
```
`EASING_ENTER` у RemotionUI и `HOUSE_EASE` у Onda — одна и та же кривая `0.16, 1, 0.3, 1`; у обоих `springSmooth` = `damping 200 / stiffness 100 / mass 1`. Это де-факто общий стандарт Remotion-экосистемы, и он совпадает с `EASE.out` из remotion-scenes.

### remotion-scenes (`src/common/easing.ts`, MIT) — 8 кривых, чистые числа
```
out        cubic-bezier(0.16,  1,     0.3,   1    )
in         cubic-bezier(0.7,   0,     0.84,  0    )
inOut      cubic-bezier(0.87,  0,     0.13,  1    )
overshoot  cubic-bezier(0.34,  1.56,  0.64,  1    )
elastic    cubic-bezier(0.68, -0.55,  0.265, 1.55 )
snap       cubic-bezier(0.075, 0.82,  0.165, 1    )
dramatic   cubic-bezier(0.6,   0.01,  0.05,  0.95 )
smooth     cubic-bezier(0.4,   0,     0.2,   1    )
```
Палитра `colors.ts`: gray-шкала 50→950 (`#fafafa … #0c0c0d`), accent `#6366f1`, secondary `#ec4899`, tertiary `#14b8a6`, success `#22c55e`, warning `#f59e0b`, danger `#ef4444`, gold `#fbbf24`, cyan `#06b6d4`. Это Tailwind-палитра, своей ценности почти нет.

### SVG-ассеты
**Их нет нигде.** В `remotion-scenes` во всём дереве 220 `.tsx` и ровно два бинарных файла — `favicon.svg` и `ogp.png` сайта-превью. У Onda есть `assets/onda-mark-animated.svg`, но это её товарный знак, прямо исключённый из MIT-гранта. Вся графика во всех пяти библиотеках рисуется кодом.

---

## 4. Почему код не переносится (одним абзацем на каждую)

- **Onda**: `CLAUDE.md` задаёт жёсткий контракт — «no `Math.random`, no `useState`, pure functions of `useCurrentFrame()`», Zod-схема как API, `spring({frame, fps, config})` из Remotion внутри каждого компонента. Всё это React-хуки + Remotion runtime.
- **RemotionUI**: явное агентское правило в `llms.txt` — «Animate with Remotion frame APIs, not CSS transitions». Прямая противоположность HyperFrames-адаптеру CSS/GSAP.
- **remotion-bits**: помимо React ещё и `three` как прямая зависимость + `prism-react-renderer`; Scene3D — своя система шагов камеры на React-контексте (`step-context`).
- **remotion-scenes**: каждая сцена — `.tsx`, импортирующий `{ C, EASE, lerp, font }` из `common` и `Easing` из `remotion`. Логика тонкая, но обёртка вся React.
- **ali-abassi**: 100 «family engines» — React-компоненты с `variant`-пропсом, 1000 пресетов = JSON с `defaultProps`. Плюс главное: **лицензии нет**, значит копировать исходник нельзя вообще.

Что при этом остаётся полезным для HyperFrames: **описания механик**. Все пять держат машиночитаемые каталоги с текстовыми описаниями «что происходит на экране» — `llms.txt` у Onda, `ai/components.json` (224 позиции, 710 КБ, с полями `props`, `aiRules`, `usage`, `related`) у RemotionUI, `registry.json` у bits, `site/data/agent-catalog.json` у ali-abassi. Это готовое сырьё для сравнения с реестром, что и сделано ниже.

---

## 5. Что берём конкретно

**Из Onda (MIT):**
1. Таблица 18 переходов из §2 — как чек-лист покрытия и как словарь имён.
2. Числа из §3 — но в HyperFrames уже своя дизайн-система (`knowledge/09_design_system.md`), так что интересны только три вещи: `STAGGER = 4 кадра` как единственное значение каскада, `OVERSHOOT = 0.03` с правилом «только two-phase heroReveal», `SHUTTER 180° / 10 samples` для motion blur.
3. Дисциплинарные правила словами: «один фокусный момент на сцену», «accent earned, never sprinkled», «raise the craft, not lower the energy».

**Из RemotionUI (MIT):**
1. `EMPHASIS` 1.05 / 1.10 / 1.18 с привязкой «уровень акцента = масштаб объекта» — этого в виде именованной шкалы у HyperFrames нет.
2. Правило `EASING.exit = ease-in, никогда ease-out` — короткое и проверяемое.
3. Словарь 224 позиций — основной источник пробелов в §7.

**Из remotion-bits (MIT):**
1. Форма API декларативной системы частиц: spawner + набор behaviors (`gravity`, `drag`, `wiggle`, `scale`, `opacity`) + детерминированная симуляция. У HyperFrames есть `confetti`, `particle-text-dissolve`, `particle-image-reveal`, `caption-particle-burst` — четыре готовых эффекта, но нет одного параметризуемого движка.
2. Идея интерполяции цвета в **Oklch** вместо sRGB (у них через culori). Для градиентных переходов это буквально другое качество картинки, а реализуется на CSS `oklch()` без библиотеки.
3. Идея пошаговой 3D-камеры в стиle impress.js: сцена = набор именованных шагов с позой камеры, переход = интерполяция между позами.

**Из remotion-scenes (MIT):**
1. Восемь кривых из §3 — забрать целиком как именованный набор (`elastic`, `dramatic`, `snap` в HyperFrames-токенах отсутствуют как имена).
2. Три таксономии, которых у HyperFrames нет как измерения: **33 дизайн-темы**, **22 варианта роллера**, **10 liquid-механик**. Подробно в §7.

**Из ali-abassi: только один приём** — числовое поле `beatMarkers: [0, 18, 36, 54]` в пресете, то есть биты как данные композиции, а не как захардкоженные задержки. HyperFrames имеет `beat-timeline` и `beat-freeze-cut`, но идея «массив маркеров в пропсах шаблона» стоит отдельного упоминания. Остальное — не берём.

---

## 6. Риски

- **ali-abassi/remotion-templates: лицензии нет.** Ни `LICENSE`, ни поля в `package.json`, GitHub API отдаёт `license: None`. По умолчанию это «все права защищены»: смотреть можно, копировать код и ассеты — нет. Сам репозиторий в README предупреждает: *«Third-party code and media retain their own license requirements; verify provenance before copying»*. Файлы `research/github-template-steal-list.md`, `research/official-remotion-steal-list.md`, `research/ui-video-steal-list.md` — их внутренние списки «что откуда взято», к ним лучше не прикасаться.
- **av/remotion-bits: MIT только в метаданных.** `package.json` и npm говорят MIT, но файла `LICENSE` в репозитории нет (ссылка на него в README битая — ведёт на `blob/main/LICENSE` при дефолтной ветке `master`). Для чистоты — брать только идеи API, не исходник, либо запросить у автора файл лицензии.
- **Onda: бренд вне MIT.** Имя, wordmark и wave-логотип исключены из гранта. `assets/onda-mark-animated.svg` использовать нельзя.
- **Шрифты.** Onda завязана на `Clash Display` + `Space Grotesk`; без них её компоненты выглядят иначе. Лицензии шрифтов — отдельная история от MIT на код.
- **Совпадение чисел не случайно.** Кривая `0.16, 1, 0.3, 1` и спринг `200/100/1` пришли из гайдов Remotion, а не изобретены этими библиотеками. Считать их «уникальной подписью Onda» не нужно.

---

## 7. Пробелы: чего в реестре HyperFrames НЕТ

Метод: 374 имени + описания из `catalog.txt` против сводного словаря механик всех пяти библиотек; каждый кандидат проверен грепом по именам и по тексту описаний, ложные срабатывания отсмотрены вручную.

### 7.1. Переходы — 8 позиций

| Кандидат | Источник | Почему пробел |
|---|---|---|
| **clock-wipe** (кромка вращается вокруг центра как часовая стрелка) | Onda `clockWipe`, RemotionUI `transition-clock-wipe`, scenes `TransitionShutter` | В реестре есть `transitions-radial` (шоукейс) и `sdf-iris`, но именно clock-hand-кромки нет ни в одном блоке |
| **frosted-glass wipe** (кромка из матового стекла, резчает к концу; уходящая заматовывается) | Onda `glassWipe`, RemotionUI `frosted-glass-wipe` | `liquid-glass-*` — это UI-панели iOS, не переход. `directional-wipe` — жёсткая кромка |
| **dip-to-color** (уход в плашку произвольного цвета и выход) | Onda `dipToColor` | `flash-through-white` покрывает только белый flash. Параметризуемого dip нет |
| **scale-coupled crossfade** (кроссфейд + синхронный масштаб 1→1.04 / 0.96→1) | Onda `morph` | `fade-through` — чистый фейд через wash. Микро-масштаб, дающий premium-ощущение, не реализован |
| **depth-push** (push + параллакс-масштаб обеих сцен, читается как долли) | Onda `depthPush`, RemotionUI `spatial-push` | `push-in` и `shared-axis-z` рядом, но это одиночные элементы, а не пара сцен с встречным масштабом |
| **card-flip между сценами** (3D-разворот, настраиваемый perspective) | Onda `flip`, RemotionUI `transition-card-flip` | `toggle-flip` — микровзаимодействие; `transitions-3d` — шоукейс без параметризуемого блока |
| **blinds / venetian** (жалюзи полосами) | RemotionUI `transition-blinds`, scenes `TransitionBlinds` | Нет вообще |
| **type-mask reveal** (гигантское слово масштабируется, пока просветы букв не выйдут за кадр; входящая видна сквозь типографику) | Onda `typeMask` | `type-match-cut` — панель растёт из негативного пространства между половинами заголовка; `texture-mask-text` — статичные маски. Механики «прохода сквозь литеры» нет |

### 7.2. Данные и графики — 11 позиций (самая крупная дыра)

В реестре по данным: `data-chart`, `animated-bar-chart`, `bar-chart-race`, `chart-story` (в нём есть donut), `decline-chart`, `mk-line-graph`, `conic-progress-ring`, `mk-usage-arc`, `count-up`, `number-wheel`, `star-rating-fill`, `telemetry-hud`. Отсутствуют:

**radar-chart · treemap · waterfall-chart · funnel-chart · gantt-timeline · candlestick-chart · heatmap-grid · sparkline-row · stacked-area-chart · scatter-plot · bubble-chart / circle-pack**

Плюс структурные диаграммы: **org-chart-build** (иерархия сверху вниз), **network-graph / node-graph** (узлы и связи; у Onda это `NodeGraph`), **commit-graph**, **ranked-table build** (`bar-chart-race` покрывает динамику, но не статичную таблицу рейтинга).
Источники: RemotionUI (`radar-chart`, `treemap-blocks`, `waterfall-chart`, `funnel-chart`, `gantt-timeline`, `candlestick-chart`, `heatmap-grid`, `sparkline-row`, `stacked-area-chart`, `scatter-plot-pop`, `bubble-chart-pack`, `org-chart-build`, `commit-graph`), scenes (`DataGauge`, `DataRanking`), ali-abassi (`tables-rankings`, `network-graphs`, `infographics`).

### 7.3. Аудио и субтитры — 7 позиций

| Кандидат | Источник | Состояние в HyperFrames |
|---|---|---|
| **audiogram-bars** (классический аудиограм-эквалайзер) | RemotionUI `audiogram-bars`, `audiogram-scene` | Есть `oscilloscope-trace` (осциллограмма) и `weight-wave`. Столбикового аудиограма нет |
| **waveform-bars-radial** (радиальная волновая форма) | RemotionUI | Нет |
| **vu-meter** | RemotionUI | Нет |
| **audio-scrubber** (полоса воспроизведения с бегунком) | RemotionUI | Нет |
| **transcript-scroll** (прокрутка транскрипта с подсветкой текущей строки) | RemotionUI | 20+ `caption-*` блоков, но прокрутки транскрипта нет |
| **speaker-label-captions** (реплики с ярлыком говорящего) | RemotionUI | Нет; для подкастов/интервью это базовый блок |
| **srt-caption-track** (сабы, читаемые из SRT-файла как данных) | RemotionUI | Нет; субтитры в реестре — стилевые компоненты, не источник данных |

### 7.4. Частицы и природные эффекты — 8 позиций

В реестре: `confetti` (seeded + gravity), `particle-text-dissolve`, `particle-image-reveal`, `caption-particle-burst`, `grain-field`, `cosmic-orb`, `spiral-galaxy`. Отсутствуют как пресеты:
**snow · sakura · fireflies · smoke · sparks/embers · lightning · bubbles · fireworks · shooting-stars**
И отдельно — **декларативный движок частиц**: один блок с spawner + behaviors (`gravity`, `drag`, `wiggle`, `scale`, `opacity`) вместо N готовых эффектов (форма API у `remotion-bits/particle-system`, набор пресетов — у `remotion-scenes/ParticleAnimations`, 10 сцен).

### 7.5. Эффекты изображения — 5 позиций

| Кандидат | Источник |
|---|---|
| **duotone** (двухтоновое перекрашивание кадра) | scenes `EffectDuotone`, ali-abassi |
| **kaleidoscope** (калейдоскопическое зеркалирование) | scenes `EffectKaleidoscope` |
| **caustics** (световые каустики, «дно бассейна») | RemotionUI `caustics-bg` |
| **topographic-lines** (изолинии / контурные карты как фон) | RemotionUI `topographic-lines-bg` |
| **scanline / CRT** (строчная развёртка, кривизна ЭЛТ) | RemotionUI `scanline-crt`, scenes `EffectVHS`, ali-abassi `retro-vhs` |

Частично покрыто: `ascii-render-pass`, `ordered-dither-pass`, `halftone-field`, `slit-scan-reveal`, `thermal-distortion`, `vignette`, `grain-overlay`, `camcorder-hud`, `yt-lcd-background`, `freeze-frame-dressing`. То есть у HyperFrames свой сильный набор экспериментальных пассов, но пяти классических нет.

### 7.6. Геометрия и формы — 4 позиции

**mandala** (радиально-симметричная развёртка), **helix** (спираль/ДНК), **hex-grid** (гексагональная сетка с волной), **concentric spinning-rings** (вложенные вращающиеся кольца).
Источник: `remotion-scenes/ShapeAnimations` (`ShapeMandala`, `ShapeHelix`, `ShapeHexGrid`, `ShapeSpinningRings`, `ShapeExplosion`).
Рядом в реестре: `conic-progress-ring`, `radial-surround`, `locked-nucleus-orbit`, `constellation-hub`, `facet-morph`, `ripple-waves` — но перечисленных четырёх нет.

### 7.7. Liquid / чернила — 6 позиций

В реестре: `ink-bleed-reveal`, `whiteboard-ink`, `hw-boil`, `soft-blob-touch`, `swirl-vortex`, `vfx-liquid-background`, `mk-background` (soft-blob градиент). Отсутствуют:
**paint-drip** (потёки краски) · **splatter** (брызги) · **oil-spill** (радужная плёнка) · **water-drop** (капля с расхождением) · **calligraphy-ink stroke** (каллиграфический нажим пера) · **fluid-wave** (сплошная жидкая волна) · **liquid-warp transition** (переход через жидкую деформацию — RemotionUI `transition-liquid-warp`, scenes `TransitionLiquidMorph`).
Источник: `remotion-scenes/LiquidAnimations`, 10 сцен.

### 7.8. Роллеры и счётчики — 8 позиций

В реестре: `slot-machine-roll`, `split-flap-board`, `number-wheel`, `number-pop-in`, `count-up`, `ticker-takeover`, `apple-money-count`. У `remotion-scenes` — целая категория из 22 роллеров. Отсутствуют варианты:
**roller-drum** (барабан с перспективой) · **roller-shuffle** (перетасовка) · **roller-dramatic-stop** (замедление и добор на последнем символе) · **roller-multi-slot** (несколько независимых слотов) · **roller-perspective-stripes** · **roller-gradient-wave** (градиентная волна по катящимся символам) · **roller-mask-slide** · **roller-outline-highlight** · **roller-blur** (motion-blur по скорости прокрутки) · **countdown-timer** (обратный отсчёт как самостоятельный блок — в реестре отсчёт есть только как chip внутри `yt-circle-pointer`).

### 7.9. Композиция кадра и списки — 2 класса, ~20 позиций

Это не отдельные блоки, а **отсутствующее измерение**.

**Редакторские layout-системы** (`remotion-scenes/LayoutAnimations`, 12 сцен): `LayoutOffGrid`, `LayoutWhitespace`, `LayoutGiantNumber`, `LayoutFrameInFrame`, `LayoutLayered`, `LayoutDiagonal`, `LayoutSplitContrast`, `LayoutGridBreak`, `LayoutAsymmetric`, `LayoutMultiColumn`, `LayoutVerticalMix`, `LayoutFullscreenType`. В реестре HyperFrames близко только `mk-placeholder-grid`, `comparison-split`, `stagger-lattice`, `kinetic-center-build` — то есть блоки есть, а системы «как ставить кадр» нет.

**Списковые системы** (`remotion-scenes/ListAnimations`, 12 сцен + RemotionUI `feature-list`, `timeline-steps`): `ListNumberedVertical`, `ListTwoColumnCompare`, `ListHeroWithList`, `ListStatsFocused`, `ListHorizontalPeek`, `ListUnevenGrid`, `ListAsymmetric3`, `ListFullscreenSequence`, `ListMinimalLeft`, `ListSimpleText`, `ListStaggered`, `ListTimeline`. В реестре: `marker-checklist-card`, `mk-specs-list`, `line-by-line-slide`, `stagger-cascade`, `spring-stack-shuffle`, `onboarding-stepper-flow`, `tracing-beam`. Нумерованного вертикального списка, двухколоночного сравнения, hero+list и uneven-grid как блоков нет.

### 7.10. Дизайн-темы — 33 позиции, крупнейший системный пробел

`remotion-scenes/ThemeAnimations` — 33 сцены, каждая = целостный визуальный стиль:
`ThemeCyberpunk · ThemeBauhaus · ThemeMemphis · ThemeSwiss · ThemeBrutalistWeb · ThemeNeobrutalism · ThemeY2K · ThemeArtDeco · ThemeBoho · ThemeHolographic · ThemeNeumorphism · ThemeGlassmorphism · ThemePaperCut · ThemeWatercolor · ThemeIsometric · ThemeIndustrial · ThemeJapanese · ThemeLuxury · ThemeMinimalist · ThemeMonochrome · ThemeNatural · ThemeOrganic · ThemePop · ThemeRetro · ThemeTech · ThemeCosmic · ThemeDuotone · ThemeGradient · ThemeNeon · ThemeDarkMode · ThemeGeometricAbstract · Theme3DGlass · Theme3DGlassThreeJS`

Ни одного слова из этого списка в реестре HyperFrames нет (проверено грепом: `cyberpunk`, `bauhaus`, `memphis`, `swiss`, `y2k`, `art deco`, `brutalis`, `neumorph`, `glassmorph`, `holograph`, `watercolor`, `paper cut`, `boho`, `isometric` — 0 совпадений). У HyperFrames есть платиновая дизайн-система как **один** стиль. Тема как переключаемое измерение композиции отсутствует.
Практический вывод: это не 33 блока на реализацию, а один механизм — **набор стилевых пресетов (палитра + типографика + текстура + характер движения), подключаемых к существующим блокам**.

### 7.11. Жанровые титульные карты — 10 позиций

`remotion-scenes/CinematicAnimations`: `CinematicEpic`, `CinematicHorror`, `CinematicRomance`, `CinematicSciFi`, `CinematicNoir`, `CinematicAction`, `CinematicAnime`, `CinematicDocumentary`, `CinematicVintage`, `CinematicMinimalEnd`.
В реестре: `titlecard-calm`, `titlecard-lockup`, `cta-lockup`, `logo-outro`, `logo-sting`, `yt-prism-title`, `hw-title`. Жанровой оси (эпик / хоррор / нуар / сай-фай / винтаж) нет ни в одном блоке. Слова `epic`, `horror`, `noir`, `romance`, `sci-fi`, `vintage`, `documentary` — 0 совпадений в каталоге (`anime` совпадает трижды, но это тег `anime-inspired` про библиотеку Anime.js, не про жанр).

### 7.12. Сцены продукта и UI — 14 позиций

Отсутствуют: **pricing-card** (плитка тарифа) · **comparison-table** (сравнительная таблица; `chatgpt-exchange` собирает таблицу внутри мока чата, отдельного блока нет) · **faq-accordion** · **kanban-move** (перетаскивание карточки между колонками) · **roadmap-lanes / swimlanes** · **calendar-month-fill** · **file-tree-reveal** · **changelog-entry** · **search-results-populate** · **poll-overlay** · **quiz-question** · **weather-card** · **sports-scorebug** · **survey-results**.
Источники: RemotionUI (scene-категория, 60 позиций), ali-abassi (`pricing-comparison`, `calendars-events`, `survey-results`, `sports-highlights`, `traffic-updates`, `election-graphics`).
Покрыто в реестре: `notification-*`, `chat-*`, `terminal-simulator`, `code-*`, `flowchart`, `hw-pipeline`, `signup-flow`, `settings-toggle-flow`, `tabs-slide-indicator`, `news-ticker`, `lower-third-*`, `social-proof-card`, `testimonial-*`, `store-badge-lockup` — то есть dev/social-сцены сильные, продуктово-корпоративные слабые.

### 7.13. 3D и камера — 4 позиции

| Кандидат | Источник | Рядом в реестре |
|---|---|---|
| **cube-face navigation** (навигация по граням 3D-куба как по сцене) | bits `bit-scene-3d-cube-nav`, scenes `Shape3DCube` | `gallery-tunnel`, `transitions-3d` — но слово `cube` в каталоге отсутствует |
| **flying-through-words** (слова спавнятся и пролетают мимо камеры) | bits `bit-flying-through-words` | Нет |
| **step-based camera rig** (сцена = именованные шаги с позой камеры, переход = интерполяция поз, impress.js-style) | bits `scene-3d` + `step-context` | `camera-rig-depth-stack`, `scroll-camera-story`, `yt-camera-move` — есть камерные блоки, нет декларативной модели шагов |
| **product exploded view / turntable** (разлёт деталей, оборот объекта на 360°) | ali-abassi `product-exploded`, `object-turntables`, `packaging-reveals` | `vfx-iphone-device` (GLTF-модели с камерной хореографией) — ближе всего, но разлёта и turntable-пресета нет |

### 7.14. Утилитарные и служебные — 4 позиции

- **Oklch-интерполяция цвета** вместо sRGB для градиентных переходов (bits `color` util через culori). В каталоге слова `oklch` нет.
- **Интерполяция градиентов** linear ↔ radial ↔ conic с разбором CSS-строки (bits `gradient` util, математика в духе Granim.js). Есть `mesh-gradient-bg`, `aurora-drift`, `gloss-sweep`, но перехода «градиент → другой градиент» нет.
- **vertical-safe-zones overlay** — рамка безопасных зон для 9:16 (UI платформы сверху/снизу). ali-abassi `vertical-safe-zones`. В каталоге `safe zone` — 0 совпадений. Для рилс-пайплайна это дешёвый и полезный служебный блок.
- **localization layouts** (RTL, CJK, длинные строки перевода без ломки вёрстки). ali-abassi `localization-layouts`, RemotionUI `subtitle-translate`. Нет.

### 7.15. Мелкие приёмы движения — 4 позиции

- **squash & stretch** как отдельный примитив с сохранением объёма. Частично живёт внутри `hw-box-label` («volume-true contact»), отдельного нет.
- **skew-in** (вход со сдвигом/скосом). RemotionUI `skew-in`. В каталоге `skew` — 0.
- **stroke-to-fill text** (обводка заливается краской). RemotionUI `stroke-to-fill-text`. Есть `outline-draw`, `svg-stroke-trace`, `stitched-text-draw` — заливки после обводки нет.
- **typewriter с опечатками** (переменная скорость + имитация ошибки и стирания). bits `variable-speed-typewriter`, `multitext-typewriter`. В реестре `typewriter`, `typed-prompt`, `notes-typing`, `streaming-text` — все без модели ошибки.

### 7.16. Что у HyperFrames наоборот сильнее

Чтобы не переносить лишнего. Ни в одной из пяти библиотек нет аналогов: 23 темы `code-snippet-*` (VS Code + Apple Terminal), `code-particle-assemble`, `code-shader-dissolve`, `code-morph` (Shiki Magic Move как paused-таймлиния), 13 шейдерных переходов (`domain-warp-dissolve`, `gravitational-lens`, `ridged-burn`, `sdf-iris`, `cross-warp-morph`, `thermal-distortion`, `swirl-vortex`, `chromatic-radial-split`, `whip-pan`, `light-leak`, `flash-through-white`, `cinematic-zoom`, `glitch`), `ios26-liquid-glass` / `macos-tahoe-liquid-glass` / `liquid-glass-*` на WebGPU, `hw-*` (13 блоков рукописной графики с реальным порядком штрихов), `stop-motion-cadence`, `ordered-dither-pass`, `ascii-render-pass`, `texture-mask-text` (66 PBR-масок), `camera-dolly-zoom` с решением фокусного расстояния из `d·tan(FOV/2)=const`, `caption-*` (20+ стилей), моки AI-чатов (`claude-exchange`, `chatgpt-exchange`, `ai-chat-reveal`), карты США в 4 вариантах.

### 7.17. Приоритезация кандидатов

**Высокий приоритет — дешёвые и часто нужные в рилсах (11):**
`clock-wipe` · `dip-to-color` · `scale-coupled crossfade` · `depth-push` · `card-flip transition` · `countdown-timer` (standalone) · `duotone` · `scanline / CRT` · `vertical-safe-zones overlay` · `частицы: snow / sparks / smoke` · `skew-in`

**Средний — заметная ценность, больше работы (10):**
`frosted-glass wipe` · `type-mask reveal` · `liquid-warp transition` · `transcript-scroll` · `speaker-label-captions` · `audiogram-bars` · `декларативный движок частиц` · `Oklch + интерполяция градиентов` · `roller-dramatic-stop / roller-drum` · `editorial layout presets (off-grid / whitespace / giant-number / frame-in-frame)`

**Системные — не блок, а измерение (3):**
`набор дизайн-тем как стилевых пресетов` (§7.10) · `жанровая ось титульных карт` (§7.11) · `списковые системы` (§7.9)

**Пакетом, когда понадобится дата-виз (11+):**
графики из §7.2 — `radar`, `treemap`, `waterfall`, `funnel`, `gantt`, `candlestick`, `heatmap`, `sparkline`, `stacked-area`, `scatter`, `bubble-pack`, `org-chart`, `network-graph`

**Низкий — узкие домены:**
`blinds` · `kaleidoscope` · `caustics` · `topographic-lines` · `mandala / helix / hex-grid / spinning-rings` · `liquid: paint-drip / splatter / oil-spill / water-drop` · `cube-face nav` · `flying-through-words` · `product-exploded / turntable` · `pricing-card` · `faq-accordion` · `kanban-move` · `roadmap-lanes` · `calendar-month-fill` · `file-tree-reveal` · `changelog-entry` · `search-results-populate` · `poll-overlay` · `quiz-question` · `weather-card` · `sports-scorebug` · `survey-results` · `localization layouts` · `vu-meter` · `audio-scrubber` · `srt-caption-track` · `stroke-to-fill` · `squash-stretch primitive` · `typewriter с опечатками`

---

## 8. Источники

- https://remotion.onda.video/components · https://remotion.onda.video/llms.txt · https://remotion.onda.video/docs
- https://github.com/degueba/onda — `README.md`, `CLAUDE.md`, `docs/motion-language.md`, `docs/design-philosophy.md`, `lib/motion.ts`, `lib/tokens.ts`, `registry/registry.json`
- https://www.onda.video/ → https://github.com/onda-engine/onda-engine (другой продукт, FSL-1.1-Apache-2.0)
- https://remotionui.com/llms.txt · https://remotionui.com/ai/components.json · https://remotionui.com/r/{motion-tokens,springs,timing}.json · https://github.com/riaz37/remotion-ui · npm `remotion-ui@0.9.0`
- https://github.com/av/remotion-bits · https://unpkg.com/remotion-bits/registry.json · npm `remotion-bits@0.2.0`
- https://github.com/lifeprompt-team/remotion-scenes — `README.md`, `src/common/easing.ts`, `src/common/colors.ts`, дерево `src/scenes/**`
- https://github.com/ali-abassi/remotion-templates — `README.md`, `src/families/*.registry.json`, дерево репозитория
- Локально: `catalog.txt` (378 строк реестра HyperFrames)
