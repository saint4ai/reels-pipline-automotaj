# 21st.dev: анимационные паттерны для вертикального рилса

Дата разведки: 2026-09-03. Цель — паттерны, где герой кадра продуктовая поверхность
(график, таблица сравнения, терминал), а не карточка на градиенте. Привязка к
`ref-21st-breakdown.md` (12 правил стиля) и `ref-21st-plan.md` (раскадровка «лаборатории»).

## 0. Что с сайтом: доступен, но HTML отдаёт грид клиентом

Сайт живой, не заглушка. Но каталог рендерится на клиенте: часть тегов через обычный
HTML-фетч вернулась с плейсхолдерами `00` вместо компонентов (`/s/chart`, `/s/bento-grid`,
`/s/bento` с первого раза). Ошибочно решить «SPA-заглушка» тут легко — на самом деле
у 21st есть отдельный канал для агентов, и он полностью надёжен.

**Ключ ко всему: к любому URL можно дописать `.md`** — отдаётся markdown вместо приложения.
Это документировано в `https://21st.dev/llms.txt`:

```
https://21st.dev/@<author>/components/<slug>.md
https://21st.dev/community/components/s/<tag>.md
https://21st.dev/@<owner>/library/<slug>.md
https://21st.dev/mcp.md   /ai.md   /pricing.md   /changelog.md   /blog.md
```

Что даёт `.md` страницы компонента: имя, **человеческое описание анимации**, автор,
библиотека, лицензия, npm-зависимости, команда установки, ссылка на живое превью.
Чего НЕ даёт: **исходного кода**. Проверено на нескольких компонентах — страница
`.md` весит 600–900 байт и кода в ней нет.

Счётчики каталога в описаниях тегов врут: заголовок пишет «10 animated number
components», а список отдаёт 3; «Browse 10 Text Reveal» — отдаёт 1; «9 code block» —
отдаёт 43. Ориентироваться надо на список, не на число в тексте.

## 1. MCP и API: что есть на самом деле

Проверено запросами, не по памяти.

| Что | Статус | Факты |
|---|---|---|
| `21st.dev/docs` | **404** | публичной doc-страницы под этим адресом нет |
| `21st.dev/mcp` | 200 | страница настройки MCP + CLI |
| `21st.dev/api`, `/api/components`, `/docs/api` | **404** | таких адресов нет |
| `21st.dev/openapi.json` | 200, 45.7 КБ | **OpenAPI 3.0, 32 операции на 24 путях** |
| `21st.dev/llms.txt` | 200, 144 строки | карта сайта для агентов, самый полезный вход |
| `api.21st.dev` | 200, но это HTML | отдаёт то же Next.js-приложение, не API |

**MCP.** Существует, называется **21st MCP**. Раньше назывался **Magic MCP** — это один и тот
же продукт, переименован. Пакет `@21st-dev/magic` продолжает работать как алиас и с версии
0.2.0 проксирует на `https://21st.dev/api/mcp`.

```bash
npx @21st-dev/cli@latest init --client claude    # рекомендованная установка
```

Клиенты: Cursor, Claude Code, VS Code, Windsurf, Codex. Ключ вида `21st_sk_…` берётся на
`https://21st.dev/mcp` или `https://21st.dev/settings/api-keys`, уходит заголовком
`x-api-key` либо `Authorization: Bearer`. Старые ключи Magic-консоли сброшены и не работают.

Инструменты MCP (старые имена принимаются и транслируются автоматически):

| Сейчас | Было |
|---|---|
| `generate` | `21st_magic_component_builder`, `21st_magic_component_refiner` |
| `get_inspiration` | `21st_magic_component_inspiration` |
| `search_logo` | `logo_search` |

Плюс поиск по каталогу, получение кода, закладки, командные библиотеки, управление профилем.

**REST API.** База `https://21st.dev/api/v1`. Теги: Account, Components, Libraries,
Templates, Themes, Team, Profile, CLI Studio Drafts. Полезное для нас:
`GET /components/search?q=&scope=&limit=`, `GET /components/install/{username}/{slug}`,
`GET /me` (план и квота).

**Важно и проверено:** в спеке у `/components/search` не указан `security`, но живой запрос
без ключа отдаёт **401**:

```
{"error":"unauthorized","message":"Missing or invalid Authorization header. Use: Authorization: Bearer <API_KEY>","status":401}
```

`GET /r/dillionverma/number-ticker` без ключа — **403** `authentication_required`
(отдаёт только метаданные компонента). То есть **API целиком закрыт ключом, включая поиск**.
Бесключевой канал ровно один — страницы `.md`.

**Квоты (из `llms.txt` и `/mcp`).** Поиск, метаданные, превью, публикация — бесплатно.
Получение **кода** компонента (копирование, install, `21st get`) — **2 раза в сутки** суммарно
на Web + MCP + CLI, дальше платно. Генерация в 21st AI — за кредиты.

**Бонус:** 21st публикует готовые Claude-скиллы, все три отдают 200:

```
https://21st.dev/.well-known/skills/21st-cli-use/SKILL.md
https://21st.dev/.well-known/skills/21st-registry/SKILL.md
https://21st.dev/.well-known/skills/21st-design-sync/SKILL.md
```

Индекса `/.well-known/skills/` нет (404), адреса надо знать. `21st-cli-use` — поиск и
установка, `21st-registry` — публикация своего, `21st-design-sync` — выгрузка дизайна проекта
в тему.

**Вывод по источнику.** Для этого проекта 21st.dev — **словарь движения, а не источник кода**.
Причины: (1) весь каталог React + Tailwind + Framer Motion, у нас HTML+CSS+GSAP; (2) код за
ключом с лимитом 2/сутки; (3) главное — **все анимации там триггерятся взаимодействием**
(hover, scroll, in-view), а рилсу нужен триггер по времени транскрипта. Порт — это всегда
переписывание триггера, а тело анимации у нас и так короче их реализации.

## 2. Восемь паттернов

Формат: что двигается и в каком порядке (по официальным описаниям 21st — это цитируемо),
затем переносимость и рецепт GSAP.

**Дисклеймер по числам.** Длительности и ease в рецептах ниже — **наши**, откалиброванные под
9:16 / 30 fps и правило «событие каждые 0.4–0.8 с». 21st нигде публично не отдаёт свои
тайминги: их нет ни на HTML-странице, ни в `.md`, только в коде за ключом. Ни одна цифра
ниже не выдаётся за цифру 21st.

---

### 2.1 Animated number / ticker / counter

**Компоненты**

| Компонент | Автор / библиотека | Ссылка | Зависимость |
|---|---|---|---|
| Number Ticker | Magic UI (Dillion Verma) | `/@dillionverma/components/number-ticker` | framer-motion |
| Number Ticker | Fancy Components (Daniel Petho) | `/@danielpetho/components/basic-number-ticker` | motion |
| Number Ticker Real-Time Metrics | ShadcnSpace | `/@shadcnspace/components/number-ticker-05` | `@number-flow/react` |
| Number Ticker Currency Counter | ShadcnSpace | `/@shadcnspace/components/number-ticker-02` | `@number-flow/react` |
| Value Flash | Özer | `/@ddoemonn/components/value-flash` | motion |

**Что двигается.** Три разных механики, которые часто путают.
1. *Твин значения* (Magic UI, Fancy): «smoothly tweens from a starting value to a target,
   with ref-based control to trigger the count on demand». Меняется только текст, геометрия
   стоит. Один твин, без stagger.
2. *Роллинг разрядов* (NumberFlow, оба ShadcnSpace): «smoothly rolls between values» —
   каждый разряд это колонка 0–9 в маске `overflow:hidden`, колонки едут по вертикали,
   разряды доезжают не одновременно. Плюс «live active pulse indicator» — отдельная
   пульсирующая точка, бесконечный луп, к числу не привязан.
3. *Флеш по знаку* (Value Flash): «flashes green or red and rolls its digits up or down
   whenever the value changes» — направление ролла зависит от знака дельты, цвет вспышки тоже.

**Портируется:** да. Твин — четыре строки GSAP. Роллинг — колонки разрядов в маске +
`yPercent`, React не нужен, `@number-flow/react` не нужен.

**Рецепт GSAP**

```js
// A. Твин значения. Для героя-числа кеглем 150.
const o = { v: 0 };
gsap.to(o, { v: 66.2, duration: 0.9, ease: "power2.out",
  onUpdate() { el.textContent = o.v.toFixed(1); } });

// Целые с разделителями — обязателен snap, иначе дробный мусор в кадре.
gsap.to(o, { v: 48250, duration: 1.1, ease: "power3.out", snap: { v: 1 },
  onUpdate() { el.textContent = o.v.toLocaleString("ru-RU"); } });

// B. Роллинг разрядов. Колонка = 10 цифр столбиком в родителе overflow:hidden.
gsap.to(cols, { yPercent: i => -10 * digits[i], duration: 0.6, ease: "expo.out",
  stagger: 0.04 });   // stagger слева направо: старший разряд садится первым

// C. Флеш по знаку.
gsap.fromTo(el, { color: delta > 0 ? "#C96442" : "#A3A8A2" },
  { color: "#1A1C1B", duration: 0.5, ease: "power1.out" });
```

- `duration` 0.9–1.2 с для героя-числа: на 30 fps это 27–36 кадров, читается.
  Меньше 0.6 — глаз не успевает считать, больше 1.4 — рилс встаёт.
- `ease: "power2.out"` / `"power3.out"`. **Никогда `back`, `elastic`, `bounce` на числах** —
  перелёт через целевое значение показывает в кадре цифру, которой в данных нет.
- CSS обязателен: `font-variant-numeric: tabular-nums` + моношрифт. Без этого ширина
  прыгает на каждом кадре и вся строка дрожит. Ровно правило 4 из разбора референса.
- Пульсирующая точка — чистый CSS `@keyframes`, не GSAP: она бесконечная и её не надо
  синхронизировать с таймлайном, а на слабой машине CSS дешевле.

---

### 2.2 Comparison table / pricing table

**Компоненты**

| Компонент | Автор | Ссылка |
|---|---|---|
| Feature Comparison Table | 7ovr | `/@7ovr/components/comparison-3` |
| Us vs Them Comparison | 7ovr | `/@7ovr/components/comparison-2` |
| Pricing Table | Kokonut UI | `/@kokonutd/components/pricing-table` |
| Table (comparison-table) | Origin UI | `/@originui/components/table/comparison-table` |
| Comparison Table | Ruixen UI | `/@ruixen.ui/components/comparison-table` |
| Performance Benchmark Card | Kavi Katiyar | `/@kavikatiyar/components/performance-benchmark-card` |

**Что двигается.** Честно: в этой категории почти **ничего**. Это самая статичная группа
каталога, и это важный факт, а не пробел разведки.
- `comparison-3`: «three plans side by side with grouped feature sections, check/value cells,
  a sticky header and a **highlighted recommended column**» — подсветка есть, но она
  статическая, задана классом, не анимируется.
- Kokonut `pricing-table`: единственный с реальным движением — «**animated price
  transitions with NumberFlow**, monthly/yearly interval toggle». Двигается только цена,
  по клику тумблера. То есть это паттерн 2.1, вложенный в таблицу.
- Ruixen: движение — переключение кнопки строки Compare↔Remove, интерактив, не появление.
- `performance-benchmark-card`: заявлена зависимость `framer-motion`, но описание движения
  не опубликовано, а код за ключом. **Что именно анимировано — неизвестно, не выдумываю.**

Вывод: «строки приезжают по одной, рамка-подсветка переезжает между строками, справа
всплывают дельты» — это **наш паттерн из референса Чеберды, а не паттерн 21st**. У 21st
берём только раскладку: сетка, sticky-шапка, выделенная колонка-победитель, ряды
`check/value`, группировка фич секциями.

**Портируется:** да, полностью — это CSS Grid плюс один абсолютно позиционированный
блок подсветки. React тут не делает ничего.

**Рецепт GSAP**

```js
const tl = gsap.timeline();

// 1. Шапка, потом ряды каскадом.
tl.from(".thead", { opacity: 0, duration: 0.3, ease: "power2.out" })
  .from(".row", { y: 14, opacity: 0, duration: 0.42, ease: "power2.out",
                  stagger: 0.07 }, "+=0.1");   // 4 ряда → разлёт 0.21 с

// 2. Рамка-подсветка ПЕРЕЕЗЖАЕТ. Один элемент .hl на всю таблицу.
function moveTo(row) {
  return gsap.to(".hl", { y: row.offsetTop, height: row.offsetHeight,
                          duration: 0.45, ease: "power3.inOut" });
}

// 3. Проигравшие гаснут до --mute.
tl.to(".row:not(.win)", { opacity: 0.45, duration: 0.3 }, "<");

// 4. Дельты справа.
tl.from(".delta", { x: -10, opacity: 0, duration: 0.32, ease: "power2.out",
                    stagger: 0.09 });
```

- `power3.inOut` на переезде рамки — то, что читается как «один объект переехал».
  С `power2.out` выглядит как «рамка мигнула в новом месте». Разница принципиальная.
- 0.45 с на переезд, 0.42 с на приезд ряда — вписывается в «событие каждые 0.4–0.8 с».
- Если подсветка ходит между ячейками разного размера — брать плагин **Flip**, он
  сам посчитает разницу геометрии. Для равных строк это лишнее.
- `tabular-nums` на всём столбце чисел, иначе колонка цен не выровняется по разряду.

---

### 2.3 Chart reveal

**Компоненты**

| Компонент | Автор | Ссылка | Зависимость |
|---|---|---|---|
| Line graph | **Motion (официальный)** | `/@motiondotdev/components/motion-line-graph` | motion |
| Line Chart (pinging dot) | Evil Charts / Legion Dev | `/@LegionWebDev/components/line-chart/pinging-dot-chart` | recharts |
| Animated Card Chart | Badtz UI | `/@badtzx0/components/animated-card-chart` | clsx, tailwind-merge |
| Threshold / Streamgraph / Finance Chart / Axis | **Airbnb visx** | `/@airbnb-visx/components/threshold` и т.д. | visx |
| Price Target Fan, Candle Chart | Savva Sicevs | `/@ssicevs/components/price-target-fan` | — |
| Line Graph Statistics | Ravi Katiyar | `/@ravikatiyar162/components/line-graph-statistics` | — |

Категория живая: 138 компонентов на теге `chart`, полный список через
`/community/components/s/chart.md`.

**Что двигается.** Эталон здесь — компонент от самой Motion: «a line graph that
**draws on enter** and shows compact percent deltas on hover». Порядок: линия
прочерчивается при появлении, дельты — отдельным слоем, по ховеру.
`pinging-dot-chart` добавляет пульсирующую точку на последнем значении.
visx-примеры — это d3-примитивы, отрисовка статическая, движение не входит.

Это ровно сцена 3 нашего плана (5.2–9.0) и сцена 2 референса.

**Портируется:** да, и это **самый переносимый паттерн из всех восьми**. Прочерчивание
линии — это `stroke-dasharray` / `stroke-dashoffset` в SVG, никакой библиотеки не нужно
вообще, ни React, ни GSAP в теории. GSAP берём ради синхронизации с таймлайном.

**Рецепт GSAP**

```js
// 1. Оси и сетка — первыми, из нулевого масштаба.
tl.from(".axis", { scaleX: 0, transformOrigin: "0% 50%",
                   duration: 0.4, ease: "power2.out" })
  .from(".grid", { opacity: 0, duration: 0.25, stagger: 0.04 }, "<0.1");

// 2. Прочерчивание линий.
document.querySelectorAll(".series").forEach(p => {
  const L = p.getTotalLength();
  gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
});
tl.to(".series", { strokeDashoffset: 0, duration: 1.1,
                   ease: "none",            // ← линейно, и только линейно
                   stagger: 0.18 });        // победитель рисуется вторым

// 3. Маркеры выпрыгивают, НАЧИНАЯ до конца линии — перехлёст 0.35 с.
tl.from(".dot", { scale: 0, transformOrigin: "50% 50%",
                  duration: 0.3, ease: "back.out(2.2)", stagger: 0.12 }, "-=0.35");

// 4. Подписи значений — за маркерами.
tl.from(".val", { y: 8, opacity: 0, duration: 0.28, stagger: 0.12 }, "<0.06");
```

- **`ease: "none"` на прочерчивании обязателен.** Это единственное место, где линейный
  ease лучше плавного: любой `power*` заставляет «перо» разгоняться и замедляться, и
  график начинает врать про плотность данных. Ошибка встречается постоянно.
- `stagger: 0.18` между сериями + акцентный цвет на победителе: он доезжает последним и
  забирает внимание. Ровно правило 3 и 5 из разбора.
- `back.out(2.2)` на маркерах — здесь перелёт уместен, точка не показывает число.
  Но не на подписи значения (см. 2.1).
- Перехлёст `-=0.35`: маркеры начинают появляться, пока линия ещё рисуется. Ощущение
  «перо роняет булавки на ходу», а не «сначала линия, потом точки».
- Бегущая подпись за фронтом линии — плагин **MotionPathPlugin** по тому же `path`, либо
  дешевле: показывать подпись у каждого маркера тем же stagger.
- Тайминг сцены: 0.4 + 1.1 + 0.4 ≈ **1.9 с**, окно плана 3.8 с — запас на подписи и источник.
- Пульсирующая точка последнего значения — CSS `@keyframes`, не GSAP (бесконечная).

---

### 2.4 Terminal / code block typing

**Компоненты**

| Компонент | Автор / библиотека | Ссылка |
|---|---|---|
| Bash Tool | **Agent Elements (сам 21st)** | `/@21st/components/bash-tool` |
| Data Stream | The Gridcn | `/@thegridcn/components/data-stream` |
| Decrypt Text | Motiq | `/@rmahammad/components/decrypt-text` |
| Terminal Decode Loader | Cameron Kelliher | `/@elements-/components/loader-terminal-decode` |
| Code Block (animated) | Animate UI | `/@skyleen77/components/primitives-animate-code-block` |
| Streaming Text | interior.dev | `/@ddoemonn/components/streaming-text` |
| Typewriter | cult/ui | `/@cult-ui/components/typewriter` |
| Typing Animation | Magic UI | `/@dillionverma/components/typing-animation` |

Отдельно: библиотека **Agent Elements** от самого 21st, 22 компонента, живёт на
`agent-elements.21st.dev`. Это готовый словарь мока агентского CLI: Bash Tool, Edit Tool,
MCP Tool, Plan Tool, Search Tool, Subagent Tool, Thinking Tool, Todo Tool, Spiral Loader,
Text Shimmer, User Message. Прямое попадание в сцену 5 нашего плана.
Индекс: `/@21st/library/agent-elements.md`.

Внимание: `/@dillionverma/components/terminal` отдаёт **пустой** `.md`. Компонента
«Terminal» под этим слагом у Magic UI на 21st нет — не ссылаться на него.

**Что двигается.** Пять разных механик:
1. *Состояния карточки* (Bash Tool): «state-driven (idle / running) with optional output and
   an approval footer (Skip / Run). Self-contained port from 21st.dev Agent Elements with
   **inline shimmer + dot keyframes**». Движение — шиммер по скелетону и точки-многоточие
   в состоянии running. Прямо совпадает с правилом 9 референса (скелетоны вместо текста).
2. *Пословный/потоковый вывод* (Streaming Text): «**token-by-token** streaming text effect
   with a **blinking caret**, skip and replay controls».
3. *Посимвольная печать* (Animate UI code block): «types out syntax-highlighted source
   **character by character** as it comes into view». Typewriter от cult/ui: печатает базовую
   строку, потом перебирает список фраз, курсор мигает.
4. *Дешифровка* (Decrypt Text): «text resolves out of **scrambled glyphs, character by
   character, with jitter**». Terminal Decode Loader: «cycles through random symbol, binary,
   or hex characters before resolving into readable text».
5. *Лог-фид* (Data Stream): «reveals **timestamped entries one by one** with type-colored
   status dots».

**Портируется:** да, и **лучше без React**. Причина: рилсу нужен кадровый детерминизм —
позиция каретки должна быть чистой функцией времени, чтобы рендер мог сикнуться на кадр N.
React-версии на `setInterval`/`useEffect` этого не дают. Наша версия одновременно короче
и корректнее.

**Рецепт GSAP**

```js
// 1. Посимвольная печать через счётчик — не через TextPlugin.
const s = "❯ /effort low", o = { i: 0 };
tl.to(o, { i: s.length, duration: s.length * 0.045, ease: "none", snap: { i: 1 },
           onUpdate() { line.textContent = s.slice(0, o.i); } });

// 2. Каретка. Жёсткий блинк, инлайн сразу за текстом — тогда едет сама.
gsap.to(caret, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true,
                 ease: "steps(1)" });

// 3. Смена чипа high → low.
gsap.timeline()
  .to(chip, { yPercent: -100, opacity: 0, duration: 0.18, ease: "power2.in" })
  .set(chip, { textContent: "low" })
  .fromTo(chip, { yPercent: 100, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.22, ease: "power2.out" });

// 4. Подчёркивание под строкой статуса.
tl.from(".ul", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.35, ease: "power3.out" });

// 5. Лог-фид: строки по одной.
tl.from(".logline", { opacity: 0, x: -8, duration: 0.22, stagger: 0.13 });

// 6. Дешифровка — плагин ScrambleText (бесплатен с GSAP 3.13).
tl.to(".num", { duration: 0.8, scrambleText: { text: "66.2", chars: "0123456789", speed: 0.4 } });
```

- **0.045 с/символ = 22 симв/с.** Строка `❯ /effort low` (13 символов) печатается 0.59 с.
  Живой человек печатает 0.06–0.09 с/символ; для 23-секундного рилса берём 0.04–0.05,
  иначе печать съедает сцену.
- `ease: "none"` + `snap: {i: 1}`. Без `snap` в `textContent` попадёт дробь.
- **`ease: "steps(1)"` на каретке.** Каретка, которая плавно гаснет, читается как баг
  рендера. Нужен жёсткий скачок.
- **TextPlugin для терминала не брать**: рвёт по словам не там, где надо, и не даёт каретку.
  Счётчик + `slice()` полностью управляем.
- Шиммер по скелетонам — CSS `@keyframes` на `background-position`, а не GSAP: бесконечный
  луп на 5–8 полосах через JS на слабой машине бьёт по кадрам зря.
- Единственное тёмное окно на светлом холсте (`--dark #141615`) — правило 11 разбора и
  строка «тёмное» из таблицы плана.

---

### 2.5 Bento grid

**Компоненты**

| Компонент | Автор | Ссылка |
|---|---|---|
| Bento Grid | Aceternity UI (Manu Arora) | `/@manuarora700/components/bento-grid` |
| **Infinite Bento Pan** | Remocn (KapishDima) | `/@kapishdima/components/infinite-bento-pan` |
| Analytics Bento | Jatin Yadav | `/@jatin-yadav05/components/analytics-bento` |
| Bento Grid | Kokonut UI | `/@kokonutd/components/bento-grid` |
| Magnified Bento | 0xUrvish | `/@0xUrvish/components/magnified-bento` |
| Stats Bento / Feature Bento | ui layout | `/@uilayout.contact/components/stats-bento` |

Тег `bento` отдал 48 компонентов.

**Что двигается.** У большинства — ничего или ховер: Aceternity это «a skewed grid layout
with Title, description and a header component», движение только при наведении.
Единственный с настоящим движением — **Infinite Bento Pan**: «a **camera diagonally drifts
across an oversized bento grid** behind a soft vignette». Заметно, что он собран на
`remotion` + `@remotion/player`, то есть это по сути видео-компонент, а не UI —
и ближе всех к нашей задаче.

**Портируется:** да. Камерный дрейф — один трансформ на контейнере плюс CSS-виньетка.

**Рецепт GSAP**

```js
// 1. Ячейки каскадом по сетке. stagger.grid — то, чего у React-библиотек обычно нет.
tl.from(".cell", { y: 24, opacity: 0, scale: 0.96, duration: 0.5, ease: "power3.out",
                   stagger: { each: 0.06, grid: [3, 3], from: "start" } });
// from: "center" — цветение из центра, from: "edges" — сборка к центру

// 2. Камерный дрейф по увеличенной сетке. Линейно и очень медленно.
gsap.to(".grid-oversized", { xPercent: -12, yPercent: -8, duration: 8, ease: "none" });
```

- Виньетка — `radial-gradient` оверлеем с `pointer-events: none`, поверх сетки.
- `ease: "none"` на дрейфе: с ease это читается как анимация, а нужно как камера.
- **Предупреждение по нашему формату.** Bento — это раскладка, а не герой кадра. Девять
  плиток на 1080×1920 делают каждую подпись нечитаемой и прямо ломают правило 1 разбора
  («герой кадра — продуктовая поверхность»). Брать bento только как установочный бит
  1.5–2 с, максимум 4 плитки, либо как фон под текст. В раскадровке плана его нет — и
  правильно, что нет.

---

### 2.6 Marquee

**Компоненты**

| Компонент | Автор | Ссылка |
|---|---|---|
| Marquee | Magic UI | `/@dillionverma/components/marquee` |
| Marquee Along SVG Path | Fancy Components (Daniel Petho) | `/@danielpetho/components/marquee-along-svg-path` |
| Marquee | Lukacho UI | `/@lukacho/components/marquee` |
| Gooey Marquee | Ali Imam | `/@designali-in/components/gooey-marquee` |
| Infinite Ribbon | Edwin Vakayil | `/@edwinvakayil/components/infinite-ribbon` |
| Logo Marquee | grootstudio | `/@grootstudio/components/logo-marquee` |
| Testimonials Marquee | ShadcnSpace | `/@shadcnspace/components/marquee-01` |

Тег `marquee` — 100+ компонентов.

**Что двигается.** Редкий случай: Magic UI **опубликовал реализацию прямо в описании**
компонента. Это единственные настоящие цифры 21st в отчёте:

```
animation: { marquee: "marquee var(--duration) linear infinite" }
keyframes: { marquee: { from: { transform: "translateX(0)" },
                        to:   { transform: "translateX(calc(-100% - var(--gap)))" } } }
```

То есть: дети дублируются, трек едет линейно на свою ширину плюс gap, бесконечно.
Вариант Daniel Petho сложнее: «animates its children continuously **along any custom SVG
path**, with hover slowdown, drag, and scroll-velocity controls».

**Портируется:** да, тривиально — это уже чистый CSS, React в нём не участвует.

**Рецепт GSAP**

```js
// Дети продублированы РОВНО один раз, тогда -50% = один полный цикл и шва не видно.
gsap.fromTo(track, { xPercent: 0 },
  { xPercent: -50, duration: 12, ease: "none", repeat: -1 });
```

- `ease: "none"` + `repeat: -1` — обязательно. Любой другой ease даёт заметный рывок
  в точке склейки цикла.
- **Почему GSAP, а не CSS-анимация Magic UI:** headless-рендер сикается на кадр N и требует,
  чтобы позиция была чистой функцией времени. Бесконечный CSS `animation` этого не
  гарантирует, твин внутри мастер-таймлайна — гарантирует. Если бегущая строка нужна
  только в браузере — оставить CSS-кейфреймы Magic UI как есть, они дешевле.
- Скорость: полный проход **10–14 с**. Быстрее 8 с на ширине 1080 уже не читается.
- Затухание краёв — `mask-image: linear-gradient(...)`, а не оверлейный div поверх.
- Для рилса: маркиз — декор, а не носитель данных. Максимум как подложка под аутро.

---

### 2.7 Text reveal

**Компоненты**

| Компонент | Автор | Ссылка |
|---|---|---|
| **Text Reveal (Mask)** | soralabs | `/@soralabs/components/text-reveal-mask` |
| Text Reveal Card | nexus-ui | `/@nexus-ui/components/text-reveal-card` |
| Decrypt Text | Motiq | `/@rmahammad/components/decrypt-text` |

Тег `text-reveal` отдаёт всего 1 компонент (в заголовке заявлено 10). Больше материала
на теге `text-animation`.

**Что двигается.** Эталон — soralabs: «a **scroll-triggered** text reveal that **masks and
slides words up line-by-line, word-by-word, or character-by-character**, with support for
**inline emphasis**». То есть: маска на строку, слова выезжают снизу вверх, гранулярность
на выбор, и отдельно предусмотрен акцент на слове внутри строки.
nexus-ui — другое: «cursor-driven text reveal», раскрытие идёт за курсором.

Это ровно наши субтитры: крупная строка внизу, максимум две строки, ключевое слово терракотой.

**Портируется:** да. Маска — это `overflow: hidden` на строке, весь трюк в ней.
Но **триггер придётся заменить целиком**: `scroll` / `whileInView` из 21st для рилса
бесполезен, вместо него позиция в таймлайне по времени слова из транскрипта. Это и есть
вся работа по порту.

**Рецепт GSAP**

```js
// Разметка: .line { overflow: hidden } > .word { display:inline-block }
tl.from(".line-1 .word", { yPercent: 110, duration: 0.55, ease: "power3.out",
                           stagger: { each: 0.045, from: "start" } });

// Акцентное слово: мгновенный перекрас на произносимом слоге, НЕ фейд.
tl.set(".kw", { color: "#C96442" }, wordStartTime);
```

- **`yPercent: 110`, а не `100`.** На ровно 100 нижние выносные (у, р, д, ц, щ) высовываются
  из-под края маски на 1–2 px. Это самая частая ошибка в этом паттерне.
- Stagger: **0.04–0.06 с по словам** для субтитра; **0.012–0.02 с по символам** (медленнее —
  и строка из 20 символов раскрывается больше секунды, рилс стоит).
- Ключевое слово **не** перекрашивать во время выезда: раскрыть всё в `--ink`, потом
  отдельным `set()` в акцент на нужном кадре. Мгновенный скачок цвета в такт слогу
  читается резче любого 0.3-секундного фейда — правило 5 разбора.
- Разбивку по словам делает плагин **SplitText** (бесплатен с GSAP 3.13) либо `split(" ")`
  в JS. Никогда не резать по `innerHTML`, если в тексте есть разметка.
- Привязка к транскрипту: `tl.add(reveal, wordStart)` — один скаляр на слово,
  синхронизация по данным, а не руками.

---

### 2.8 Spotlight / border-beam

**Компоненты**

| Компонент | Автор / библиотека | Ссылка |
|---|---|---|
| Border Beam | Magic UI | `/@dillionverma/components/border-beam` |
| Border Beam | Badtz UI | `/@badtzx0/components/border-beam` |
| Shine Border | Magic UI | `/@dillionverma/components/shine-border` |
| Border Trail | Motion Primitives (ibelick) | `/@ibelick/components/border-trail` |
| Moving Border | Aceternity UI | `/@manuarora700/components/moving-border` |
| Spotlight New | Aceternity UI | `/@manuarora700/components/spotlight-new` |
| Spotlight (border-only) | ibelick | `/@ibelick/components/spotlight/border-only` |
| Animated Beam | Magic UI | `/@dillionverma/components/animated-beam` |

Теги: `border-beam` — 22, `spotlight` — 35.

**Что двигается.** Все описания сходятся к одному: «an animated **beam of light which
travels along the border** of its container» (Magic UI), «animated border effect that
**moves along the edges** of its parent container» (ibelick), «a border that **moves around**
the container» (Aceternity). Единственный элемент — светящийся сегмент, идущий по контуру,
бесконечно, линейно. Spotlight New — «left and right spotlight», два статичных
радиальных пятна. Animated Beam — луч не по контуру, а по произвольному пути между узлами.

**Портируется:** да, тремя техниками. Но см. вердикт по формату ниже.

**Рецепт GSAP**

```js
// A. Луч по контуру через offset-path — самый честный способ.
gsap.set(beam, { offsetPath: "path('M12,0 H288 A12,12 0 0 1 300,12 ...')",
                 offsetRotate: "auto" });
gsap.to(beam, { offsetDistance: "100%", duration: 2.6, ease: "none", repeat: -1 });

// B. Дешевле, без пути: вращение conic-gradient под инсет-маской.
gsap.to(card, { "--beam-angle": "360deg", duration: 3, ease: "none", repeat: -1 });

// C. Spotlight: радиальный градиент по CSS-переменным.
gsap.to(el, { "--mx": "70%", "--my": "30%", duration: 1.4, ease: "power2.inOut" });
```

- **Ловушка варианта B:** без объявления `@property` градиент не сдвинется вообще.
  Обязательно:
  ```css
  @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false }
  ```
  Кастомная переменная без `@property` для браузера — строка, а строки не интерполируются.
- `offset-distance` анимируется и уходит в композитор; в Chromium (а headless-рендер это
  Chromium) работает штатно.
- `ease: "none"` + `repeat: -1` на луче, иначе он «дышит» на стыке цикла.
- **Вердикт по нашему формату.** Бесконечный луч по рамке прямо конфликтует с правилом 5
  разбора: каждый элемент появляется по слову речи, а луп крутится сам по себе и добавляет
  шум на все 23 секунды. Использовать **однократно**: один проход `repeat: 0`, 0.5–0.7 с,
  как подсветку строки-победителя в такт слову. Именно так это и работает в референсе —
  там рамки строк «появляются по одной в такт речи», а не светятся постоянно.

## 3. Сводка: что реально берём в проект

| Паттерн | Ценность для рилса | Что берём у 21st |
|---|---|---|
| Chart reveal | **высокая** | подтверждение паттерна «draws on enter» + дельты слоем |
| Terminal typing | **высокая** | словарь Agent Elements: 22 состояния агентского CLI |
| Animated number | **высокая** | три механики: твин / роллинг разрядов / флеш по знаку |
| Text reveal | средняя | маска+выезд слов, гранулярность, inline emphasis |
| Comparison table | средняя | только раскладка; движения там почти нет |
| Spotlight / beam | низкая | техника есть, но луп противоречит правилу 5 |
| Marquee | низкая | готовые кейфреймы, но для рилса это декор |
| Bento grid | низкая | ломает правило 1; годится только как фон |

Три вещи, которые стоит забрать помимо паттернов:
1. `https://21st.dev/community/components/s/<tag>.md` — бесплатный неограниченный способ
   искать движение по словарю. Держать под рукой.
2. Библиотека **Agent Elements** — самый близкий к нашей сцене 5 набор, от самого 21st.
3. Три опубликованных Claude-скилла на `/.well-known/skills/` — если решим ставить CLI.

Что НЕ стоит: тянуть код через MCP/CLI. 2 извлечения в сутки, React+Framer Motion на выходе,
триггеры по ховеру и скроллу. Переписывание триггера на таймлайн стоит дороже, чем написать
тело анимации с нуля по рецептам выше.
