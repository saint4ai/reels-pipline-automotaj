# Технический пайплайн

## Общая схема

```
исходник 4K → нарезка+кроп в вертикаль ─┐
                                        ├→ ОДИН проход ffmpeg → готовый рилс
React-вставки → PNG-кадры с альфой ─────┤
пословные субтитры → ASS ───────────────┘
```

**Ключевое правило: один проход кодирования.** Каждое лишнее перекодирование съедает качество.
Собирать всё фильтрами в одной команде, а не последовательными файлами.

## 1. Прозрачный слой из Remotion

**Альфа сохраняется ТОЛЬКО при рендере кадрами.** Проверено:

| Способ | Результат |
|---|---|
| `--codec=prores --prores-profile=4444` | `yuv422p12le`, альфы нет |
| `--codec=vp8` / `vp9` | `yuv420p`, альфы нет |
| `--sequence --image-format=png` | **альфа есть** |

```bash
npx remotion render <Composition> out/seq --sequence --image-format=png
```

Проверить альфу:
```bash
python3 -c "
from PIL import Image
im=Image.open('out/seq/element-0100.png').convert('RGBA')
print('прозрачность' if im.getchannel('A').getextrema()[0]==0 else 'НЕТ АЛЬФЫ')"
```

⚠️ Имена кадров зависят от длины композиции: `element-00.png`, `element-000.png` или
`element-0000.png`. Перед сборкой посмотреть `ls out/seq | head -1` и подставить `%02d`/`%03d`/`%04d`.

## 2. Пословные субтитры

Источник таймингов — субтитры YouTube (быстро, без нагрузки на мак) либо Whisper:

```bash
yt-dlp --skip-download --write-auto-sub --sub-lang "ru-orig,ru" --sub-format json3 \
  -o "podcast.%(ext)s" "<url>"
```

Разбор `json3` в список слов:
```python
for ev in data['events']:
    t0 = ev.get('tStartMs', 0)
    for s in ev.get('segs', []):
        words.append({"t": (t0 + s.get('tOffsetMs', 0)) / 1000, "w": s['utf8'].strip()})
```

⚠️ Автораспознавание путает термины: «вайпкодинг» → «вайбкодинг», «неронка» → «нейронка».
Прогонять словарь замен перед сборкой.

## 3. Формат ASS для субтитров

Стиль под вертикаль 1080×1920:
```
Style: Sub,Benzin-ExtraBold,96,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,9,3,2,60,60,340,1
```
- Цвет в ASS задаётся как `&H00BBGGRR` — байты в обратном порядке. Лайм `#B6FF00` → `&H0000FFB6&`.
- Обводка 9 при кегле 96 — иначе текст пропадает на светлых кадрах.
- `MarginV 340` — субтитры внизу. Вставка ниже `y 1400` их перекроет.

Пружинный вход слова:
```
{\fscx116\fscy116\t(0,90,\fscx100\fscy100)\1c&H0000FFB6&\3c&H00000000&\fad(40,60)}СЛОВО
```

## 4. Сборка одним проходом

```bash
ffmpeg -y -ss <старт> -i source-4k.webm \
  -framerate 30 -start_number 0 -i "out/seq/element-%03d.png" \
  -filter_complex "\
[0:v]trim=duration=<длит>,setpts=PTS-STARTPTS,\
crop=1215:2160:1312:0,scale=1080:1920:flags=lanczos,\
eq=contrast=1.08:saturation=1.05,\
tpad=stop_mode=clone:stop_duration=1.5[base];\
[base][1:v]overlay=0:0:shortest=1[ov];\
[ov]ass=subs.ass:fontsdir=/Users/miso/Library/Fonts[v];\
[0:a]atrim=duration=<длит>,asetpts=PTS-STARTPTS,apad=pad_dur=1.5[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset slow -crf 15 -tune film -profile:v high -level 4.2 -pix_fmt yuv420p \
  -x264-params "ref=4:bframes=3:me=umh:subme=8" \
  -c:a aac -b:a 256k -ar 48000 -ac 2 out.mp4
```

Порядок слоёв обязателен: **видео → вставки → субтитры**.

**Кроп 16:9 в вертикаль:** из 3840×2160 берём `1215:2160:1312:0` — полная высота,
ширина по центру. Даёт минимальный даунскейл до 1080×1920.

**Пауза под финальную конструкцию:** `tpad=stop_mode=clone:stop_duration=1.5` для видео
плюс `apad=pad_dur=1.5` для звука — иначе рассинхрон длительностей.

Целевой битрейт для вертикали — **6–8 Мбит/с**. Ниже 5 картинка сыпется на движении.

## 5. Склейка частей

Хук, речь и концовка кодируются **одинаковыми параметрами**, тогда склейка идёт без
перекодирования:
```bash
printf "file '/tmp/hook.mp4'\nfile '/tmp/speech.mp4'\nfile '/tmp/end.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy -movflags +faststart out.mp4
```
Вставки из Remotion идут без звука — добавить тишину:
`-f lavfi -i anullsrc=r=48000:cl=stereo -shortest`

## 6. Шрифты

- Загрузка в коде — `src/overlay/fonts.ts`, вызывает `loadFont` из `@remotion/fonts`.
  Без этого рендер молча берёт системный sans-serif.
- Benzin в Google Fonts нет, файл лежит в `public/fonts/Benzin-ExtraBold.ttf`.
- Для ffmpeg — `fontsdir=/Users/miso/Library/Fonts`, имя в ASS `Benzin-ExtraBold`.
- Шрифты **без кириллицы**, проверено: Bebas Neue, Boldonse, Big Shoulders,
  Bricolage Grotesque — 0 из 64 глифов. libass молча подменит на системный.
- С полной кириллицей: Benzin (5 начертаний), Soyuz Grotesk, Gilroy, Inter.

## 7. Безопасные зоны кадра 1080×1920

| Зона | Координаты | Что там |
|---|---|---|
| Decorative bleed | x 0–1080, y 0–1920 | фон, сетка, свет, текстура и незначимые формы |
| Supporting visual | x 100–980, y 180–1500 | крупные объекты, неактивные ветки схем; допускают безопасный кроп |
| Instagram critical content | x 108–864, y 269–1248 | текст, CTA, реальные логотипы, активные узлы и глаза спикера |
| Combined Instagram+TikTok | x 120–840, y 260–1360 | обязательная cross-platform proof-зона |
| Reels action-rail risk | x 864–1080 | сюда не ставить читаемый или обязательный элемент |
| Podcast caption | x 120–840, y 904–1016 | `h=112`, `centerY=960`; отдельный формат |
| Expert split fallback | x 120–840, y 816–928 | `h=112`, `centerY=872`; hard gap 32 px до panel Y=960 |
| Expert talking-head | x 120–840, y 1192–1304 | `h=112`, `centerY=1248`; hard chin gap 32 px, preferred 48 px |
| Full-graphics main caption | x 120–840, y 480–592 | отдельная lane без спикера |
| Italic semantic callout | x 200–820, y 1030–1160 | отдельная safe band над full-graphics caption |

Перед сдачей создавать отдельную proof-копию, не изменяя master:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-reels-safe-zone.ps1 `
  -InputVideo "<master.mp4>" `
  -OutputDirectory "<project>\renders\qa"
```

Гайд объединяет официальную рекламную safe-zone Meta (`14%` сверху, `35%` снизу,
`6%` по бокам) и реальный device crop из пользовательского скриншота (`≈98 px` с каждой
стороны). Для organic Reels Meta не публикует постоянную пиксельную зону, поэтому итоговая
проверка остаётся визуальной. Источник координат:
`reference/platform-guides/instagram-reels/safe-zone-1080x1920.json`.

Instagram proof не доказывает TikTok-safe layout. Перед кросс-платформенной сдачей проверить
тот же master отдельными Instagram, TikTok и combined review overlays из
`reference/platform-guides/ui-proof-overlays/`, затем выполнить in-app preview. Overlay остаётся
только в proof-копии. Если TikTok proof не пройден, TikTok delivery не считается проверенным.

Stock transition не должен приносить собственную звуковую дорожку в master: её исключают на
import либо duck-ают на `12–18 dB` под речь. Переход длится `4–10 кадров`, имеет opacity не
выше `70%`, детерминированный тайминг и проходит покадровую проверку на watermark.

## 8. Sparse face/head QA до рендера

Установить лёгкие зависимости и прогнать только редкие кадры исходника:

```bash
bash scripts/run-face-caption-qa.sh
```

Скрипт использует `opencv-python-headless` и встроенные Haar frontal/profile/eye cascades;
полный render и чтение всех кадров не нужны. Опциональный YuNet ONNX поддерживается через
`--yunet-model`, но локальной DNN-модели сейчас нет.

Выходы: JSON/CSV trajectory, Markdown verdict и annotated contact sheet в `analysis/` проекта.
Hard gate: expert portrait caption ниже transformed chin с gap минимум `32 px` (`48 px`
preferred), не пересекает head/face/eyes и заканчивается до bottom UI. Если legal slot
отсутствует — `LAYOUT_SWITCH`. Expert split использует compact fallback `centerY=872`;
podcast `centerY=960` проверяется отдельно на своём исходнике.

Фактический `IMG_7333` audit: 54 sparse frames из 1596, face detection `100%`; стандартный
expert portrait `PASS 54/54`, compact split `PASS 54/54`. Первый title-crop выявил конфликт
на `03.0–04.0s`; после reframe speaker-card с `y=540–1200` до `y=540–1160` повторный gate
прошёл `PASS 7/7`. История исправления и финальные координаты сохраняются в JSON/CSV/отчёте.

## 9. Пакеты Remotion

Установлены версии `4.0.484` (ядро тоже 4.0.484 — не обновлять ради пакетов):
`@remotion/paths` (прочерчивание), `@remotion/shapes` (геометрия),
`@remotion/layout-utils` (`fitText`, `measureText`, `fitTextOnNLines`),
`@remotion/motion-blur`, `@remotion/captions`, `@remotion/fonts`.
