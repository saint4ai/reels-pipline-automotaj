# Reels Pipeline · Автомонтаж

**[onAI Academy](https://onai.academy)** · автор **[@saint4ai](https://instagram.com/saint4ai)**

Производственный пайплайн вертикальных рилсов 1080×1920: база знаний по монтажу,
рабочие композиции, QA без рендера и слой экономии токенов при работе с AI-агентом.

Собран на реальном производстве, а не на теории. Все числа ниже измерены.

[Блог](https://onai.academy/blog/) · [Instagram](https://instagram.com/saint4ai) · [Telegram](https://t.me/strogo_na_opuse)

---

## Что это решает

Агент, монтирующий видео, сжигает подписку быстрее, чем успевает выпустить ролик.
Мы померили, куда именно уходят токены, и построили слой, который это чинит.

| Статья расхода | Эквивалент за сессию | Доля |
|---|---:|---:|
| Параллельные субагенты (31 штука) | 16 854 197 | **74,5 %** |
| Выход модели (797k × 5) | 3 990 000 | 17,6 % |
| Перечитывание контекста (28,98 млн × 0,1) | 2 898 000 | 12,8 % |
| Чтение всех файлов проекта | ≈ 70 000 | **0,3 %** |

Чтение файлов — последняя статья, а не первая. Разница с первой в двести сорок раз.
Методика и чек-лист внедрения — [docs/checklist.md](docs/checklist.md).

## Главный приём: агент спрашивает, а не читает

```bash
python3 scripts/pipe.py scenes videos/my-project
```

```
COMPOSITION legal-ai-pilot 1080x1920 @30fps dur=39.83s  [index.html, 60195 байт]
    0.00+39.83  video #speaker-video     src=source-clip.mp4 tweens=0
    1.37+2.59   audio #sfx-impact        src=sfx_001.mp3 tweens=0
   19.05+1.62   audio #sfx-error         src=sfx_003.mp3 tweens=0
  CAPTIONS x30  0.05..39.83s   → pipe.py captions
  ANIM #phase-hook:3, .hook-shake:3, #phase-process:3, #phase-evidence:3
```

**1 099 байт вместо 60 195.** По таймингам и структуре не потеряно ничего.

| Композиция | Целиком | Через `pipe` | |
|---|---:|---:|---:|
| Подкаст-рилс | 60 195 б | 2 403 б | **25×** |
| Экспертный рилс | 95 555 б | 2 770 б | **34×** |

## Три закона фильтрации

Ценность не в скриптах, а в правилах. Под ваш стек скрипты будут другими, законы те же.

**1. У каждой команды есть байтовый потолок.** При превышении вывод обрезается с явным
маркером: сколько выброшено и чем достать. Молчаливого усечения не бывает — тихая обрезка
хуже отсутствия данных, потому что агент считает, что видел всё.

**2. Лестница важности.** `[BLOCKING]` — дословно и сразу. `[ACTIONABLE]` — одной строкой
с указателем. `[INFO]` — только в `logs/`, в разговор не попадает никогда.

**3. Проекция, а не пересказ.** Пересказ теряет информацию непредсказуемо. Проекция —
точный вид на явно выбранное подмножество, поэтому всегда видно, чего ты не видишь.

## Команды

```bash
python3 scripts/pipe.py state    <project>   # что за проект, что сломано
python3 scripts/pipe.py scenes   <project>   # карта композиции, тайминги, твины
python3 scripts/pipe.py captions <project>   # субтитры с таймингами
python3 scripts/pipe.py check    <project>   # вердикт линтера, ошибки дословно
python3 scripts/pipe.py blocks   <project>   # установленные блоки реестра
python3 scripts/pipe.py qa       <project>   # вердикт face/safe-zone QA
python3 scripts/pipe.py --about              # авторство и происхождение
```

Рендер запускает человек, не агент:

```bash
bash scripts/render-safe.sh <project> renders/out.mp4    # WSL / Linux / macOS
.\scripts\render-safe.ps1 -ProjectDirectory <project>    # Windows
```

Обёртка ставит тихий режим, кладёт полный лог в `logs/`, показывает максимум двадцать строк.
Без неё один прогон печатает 108 317 байт, из которых 24 600 символов — квадратики
прогресс-бара.

## База знаний

| Файл | Что внутри |
|---|---|
| [knowledge/01_catalog.md](knowledge/01_catalog.md) | 62 приёма анимации: механика, когда уместен |
| [knowledge/02_editing.md](knowledge/02_editing.md) | Принципы монтажа: ритм, склейки, адаптивные раскладки |
| [knowledge/03_rules.md](knowledge/03_rules.md) | Смысл фразы → приём, плотность вставок, цветовой код |
| [knowledge/04_pipeline.md](knowledge/04_pipeline.md) | Рендер, субтитры, ffmpeg, шрифты, safe-zone |
| [knowledge/05_pitfalls.md](knowledge/05_pitfalls.md) | Грабли, на которых уже наступали |
| [knowledge/06_copywriting.md](knowledge/06_copywriting.md) | Хуки, структура, связка текста с подсветкой |
| [knowledge/07_production_system.md](knowledge/07_production_system.md) | Полный production playbook |

Начинать — с [CONTEXT.md](CONTEXT.md), это входная дверь для агента.
История решений и забракованных подходов — в [history/](history/).

## QA без рендера

| Скрипт | Что делает |
|---|---|
| [scripts/face-caption-clearance.py](scripts/face-caption-clearance.py) | OpenCV-траектория лица и проверка, что субтитр не сел на подбородок. Без полного рендера |
| [scripts/check-reels-safe-zone.sh](scripts/check-reels-safe-zone.sh) | Proof-кадры с safe-zone оверлеем, master не трогается |
| [reference/platform-guides/](reference/platform-guides/) | Реальные safe-zone Instagram Reels и TikTok, адаптивные позиции субтитров |

Один кадр, показанный модели, стоит около 1500 токенов — дороже всего вывода линтера.
Поэтому QA возвращает вердикт текстом, а кадры остаются на диске.

## Установка

Нужен Node ≥ 22, ffmpeg, Python 3.10+. Подробно — [SETUP.md](SETUP.md).

```bash
git clone https://github.com/saint4ai/reels-pipline-automotaj
cd reels-pipline-automotaj
python3 scripts/pipe.py --about
```

## Авторство

Автор метода и реализации — **onAI Academy**, [@saint4ai](https://instagram.com/saint4ai).

Лицензия MIT: используйте, изменяйте, встраивайте в свои проекты, в том числе коммерческие.
Единственное условие — сохраняйте [LICENSE](LICENSE) и [NOTICE](NOTICE) в производных работах
и не выдавайте метод за собственную разработку. Подробности — в [NOTICE](NOTICE).

Метки происхождения `origin=onai-rpa-2026-09` и `spec=three-laws/v1` встроены в заголовки
скриптов и в константы `pipe.py`. Проверить: `python3 scripts/pipe.py --about`.

## Чего здесь нет

Исходные видео, аудио, готовые рендеры и стоковая библиотека переходов в репозиторий
не входят — по размеру и по неподтверждённому лицензионному статусу. Личные данные
участников подкаста обезличены до ролей.

---

**onAI Academy** · [onai.academy](https://onai.academy) · [@saint4ai](https://instagram.com/saint4ai) · [Telegram](https://t.me/strogo_na_opuse)

---

## Обновление 3 сентября 2026 — монтажный пайплайн v4

Формат собран и утверждён на реальном ролике (`videos/reels-1-composio`): платиновая дизайн-система, сборщик
сториборда, валидатор из 26 проверок, runbook для агента и правила поведения по Карпати.

- Порядок работы шаг за шагом: [docs/agent-contract/MONTAGE-RUNBOOK.md](docs/agent-contract/MONTAGE-RUNBOOK.md)
- Дизайн-код всех рилсов: [knowledge/09_design_system.md](knowledge/09_design_system.md)
- Технический пайплайн от исходников до приёмки и цена в токенах: [knowledge/10_montage_pipeline.md](knowledge/10_montage_pipeline.md)
- Что пишет режиссёр (схема сториборда) и что пишет агент руками (контракт parts): [docs/agent-contract/](docs/agent-contract/)
- Правила поведения агента и бюджеты фаз: [docs/agent-contract/KARPATHY-MONTAGE.md](docs/agent-contract/KARPATHY-MONTAGE.md), скилл `.claude/skills/karpathy-guidelines`
- Новый проект из эталона: `bash scripts/new-reel.sh <id>` → `python3 scripts/pipe.py build videos/<id>` → `bash scripts/render-safe.sh videos/<id> renders/out.mp4`

Медиа, рендеры и платные шрифты в репозиторий не входят; шрифты восстанавливает `scripts/fonts.sh`.
