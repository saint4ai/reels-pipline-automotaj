# storyboard.json, schema 7 — контракт режиссёра

Эталон: `videos/reels-1-composio/storyboard.json`. Читают: `scripts/assemble.py` (собирает index.html),
`scripts/pipe.py validate` (проверяет правила), `pipe.py plan [--layout]` (проекции). Пишет: режиссёрская
сессия. Время везде в секундах от начала композиции, координаты в px кадра 1080×1920.

| Поле | Тип | Кто использует | Правила |
|---|---|---|---|
| `schemaVersion` | 7 | assemble | меньше 7 — сборщик не запускается |
| `composition.{id,fps,width,height,durationSeconds}` | | assemble, qa, validate V15 | `id` = ключ `window.__timelines`; `qa` сверяет длительность мастера ±1 кадр; `durationSeconds` ≥ конца речи, иначе BLOCKING (короче речи → сборщик отбросит субтитры; клип с `data-duration ≤ 0` ломает рантайм) |
| `theme.{paper,paperMid,paperLo,ink,lime,orange,grey,gridPitch,gridOpacity}` | hex, px | assemble | лайм `#B6FF00`, оранж `#FC5C02`, чернила `#111214` (DECISIONS) |
| `sources.speaker.{file,native}` | | assemble, validate V5 | файл с ключевым кадром каждые 30 кадров; апскейл окна ≤ 1.2× от `native` |
| `sources.speech.file` | | assemble | отдельная аудиодорожка речи, `data-volume=1` |
| `speakerWindow.states.{NAME:{x,y,w,h}}` | | assemble, validate V3/V4/V5 | нижний край всех состояний = `invariant.bottomEdgeY`; состояние не пересекает панель и полосу субтитров (зазор ≥ 32) |
| `speakerWindow.initial`, `moves[{at,to,why}]` | | assemble, validate V24 | смена положения не реже раза в 10 с (DECISIONS 02.09.2026). Тот же размер — слайд 0.32 с; другой размер — затемнение 2 кадра, подмена, проявление 3 кадра. Зумов нет |
| `captions.{lane,baseFont,size,wordsPerGroup,emphasis[{word,color}]}` | | assemble, validate V20 | Gilroy, 66, три слова, `lane.y=904` для podcast-пресета; акценты STIX Italic лаймом или оранжем; акцент не ближе 1.2 с к структурному событию (V11) |
| `clips[{id,file,at,dur,box,fit,radius,enter,group}]` | | assemble, validate V12/V14 | вставки: футаж, чат, профиль. `enter: rise|cut`. `group` объединяет нарезку одного футажа в одну конструкцию; покрытие клипом снимает замечание V12 о паузе |
| `custom.{html,css,js}` | пути в `parts/` | assemble | рукописный смысловой объект, контракт в `PARTS-CONTRACT.md` |
| `spine.*` | свободная структура | parts/spine.js через `SB.spine`, validate | обязательны поля с `at` и `word` у событий: валидатор сверяет слово с транскриптом ±0.12 с (V8) |
| `transitions[{at,window,frames,opacity,boundary}]` | | assemble, validate V6 | `window` — id из `reference/transitions/trims/index.json`; 4–10 кадров; opacity ≤ 0.7; одна вспышка на ролик; интервал ≥ 6 с |
| `audio.hits[{at,file,volume,dur,on}]` | | assemble, validate V7 | один тип, не больше трёх срабатываний, не в первые 1.5 с |
| `motion[{kind,selector,bySec|a,b}]` | | assemble → `index.motion.json` | `appearsBy`, `before`, `staysInFrame`; `check` проверяет на том же таймлайне |

Чего в сториборде **нет**: прозы «почему» больше одного поля `why` на объект, дублирующего `timeline[]`
(его печатает `pipe.py plan`), координат из safe-zone (они в пресетах), HTML.

Цикл: написать → `pipe.py validate` (0 BLOCKING) → `pipe.py plan --layout` (нет пустых секунд и
статичного спикера дольше 10 с) → показать Александру → `pipe.py build`.

## `scenes[]` — библиотека сцен (parts/scenes.*, эталон videos/reels-1-composio)

Сцена живёт в верхнем канвасе (по умолчанию зона 96,96,888×764) от `from` до `to`; вход 0.22 с подъёмом,
выход 0.14 с. Все события внутри — на словах транскрипта (`word`, валидатор V8 сверяет ±0.12 с).

| `kind` | Что рисует | Поля |
|---|---|---|
| `card` | светлая карточка: `eyebrow` («01 / ТЕМА»), `headline` прописными (акцент: `**лайм**`, `^^оранж^^`), `subline` курсивом STIX, `list[]` строк с накоплением (прежние гаснут до 45%), `chips[]` знаков, `objects[]` | `zone` подбирать под содержимое: список 764, чипы 400, схема 580 |
| `kinetic` | стек слов без рамки: `stack[{at,word,text,role:light|heavy|accent|number,color,icon,sticker}]`; вход слова 3 кадра, число — pop | связка → ключ → акцент → цифра, как в референсе 0902 |
| `screen` | карточка на обоях `screen{x,y,w,h}` + рамка окна под клипами сцены; `labels[]` заголовки над карточкой сменяют друг друга | клипы кладутся сторибордом (`clips[]`) внутрь окна: 800×596 при (140,250) |
| `overlay` | без рамки, объекты поверх всего кадра (финальный CTA) | объекты на слое `#overlay` (z 6) |

Объекты `objects[]` (координаты внутри сцены; для `screen`/`overlay` — на верхнем слое):
`clock{box,at,until}` стрелка идёт; `socket{box,at,composioAt}` Claude — Composio — Instagram с проводом;
`arrow{from,to,at,until}` draw-on 8 кадров с наконечником; `highlight{box,color}`; `bubble{text,box}`;
`stamp{text,color,box,rotate}` штамп с overshoot; `chart{bars[],box}` столбики растут; `chip{text,box}` лаймовый чип.
`note{text,box,at,word}` рукописная подпись STIX italic с лаймовой чертой, наклон −3°, одна на сцену.

Поля сцены поверх `kind`: `kicker` (лаймовый чип над стеком `kinetic`, хук), `fullscreen: true` (спикер гаснет
на `from`, возвращается на `to`; ставить перед стоковым переходом), `captionY` (центр полосы субтитров на время
сцены, переезд 0.28 с; в fullscreen — 1290), `screen.bar` (адресная полоса 40 px над экраном, только настоящий
адрес). У клипа: `fit` (`cover|contain`) и `pos` (`object-position`, например `50% 100%` — низ записи).
Координаты `highlight`/`arrow` — абсолютные в кадре; остальных объектов — относительно зоны сцены.
Облик всех элементов — `frame.md` проекта и `knowledge/09_design_system.md`.

Правила ритма для этого формата: кинетические слова, строки списка и подписи экрана — не триггеры
(валидатор их не считает в V10); акцентов (стикер, штамп, цифра, стрелка, график) — один в момент.

## Дополнения 3 сентября 2026 (v4)

- `speakerWindow.states[name]`: `border` (px рамки, 0 для полукадра), `pos` (`object-position` видео — кадрирование
  головы), `captionY` (центр полосы субтитров в этом состоянии; сборщик переезжает полосу на смене за 0.28 с, стартуя за
  0.22 с до смены). `constraint.maxUpscale` читает V5.
- Сцена: `tint: lime|orange|blue` — цветной радиал фона на время сцены; `labels[].icon` — знак сервиса на чёрном чипе.
- `markers[{at}]` — рисованный лаймовый штрих-переход (parts/scenes.js), не требует тримов и прав.
- Клип: `fit: contain` обязателен для записей Александра; бокс по пропорции источника; `pos` только для `cover`.
- Полоса субтитров `60,900 · 770×120` — правая граница 830, вне панели Reels.
- Карточка: `headlineStyle: "script"` — заголовок рукописным курсивом STIX 64 без капса; `subline.style: "sans"` —
  подстрочник Gilroy капсом. Чередовать с обычным регистром через сцену (09_design_system §7).
- Координаты `chip` и `highlight` — абсолютные в кадре (слой overlay), как у `arrow`; CTA-чип подкаста: `{40,780,560,60}` — под карточками, над полосой субтитров.
