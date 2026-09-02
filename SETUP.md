# Поднять окружение на новой машине

## 0. Установить skills и постоянную память

```powershell
# Windows / PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-portable.ps1
```

```bash
# WSL / macOS / Linux
bash scripts/bootstrap-portable.sh
```

Скрипты копируют repo-local `onai-content-engine` и `talking-head-recut` в Codex,
а также устанавливают Marketing Skills и три copywriting-skills. Если внешние skills
уже установлены, используйте `-SkipExternalSkills` в PowerShell или
`--skip-external-skills` в bash.

## 1. Системные зависимости

macOS: `brew install ffmpeg yt-dlp`.

Windows: установить Node.js ≥ 22, Google Chrome и ffmpeg/ffprobe; затем проверить,
что команды `node`, `npx`, `ffmpeg` и `ffprobe` доступны из PowerShell.

WSL/Linux: установить Node.js ≥ 22, ffmpeg и системный Chrome/Chromium.

Нужен Node ≥ 22. Проверить: `node -v`.

## 2. Локальный ASR без переноса виртуального окружения

```bash
cd videos/podcast-reel-pilot
export PODCAST_SOURCE_PATH='/absolute/path/to/podcast-source.mp4'

# Переносимый CPU-вариант
bash scripts/setup_asr.sh
ASR_DEVICE=cpu ASR_COMPUTE_TYPE=int8 \
  bash scripts/run_asr.sh "$PODCAST_SOURCE_PATH"

# NVIDIA CUDA-вариант
bash scripts/setup_asr.sh --cuda
ASR_DEVICE=cuda ASR_COMPUTE_TYPE=int8_float16 \
  bash scripts/run_asr.sh "$PODCAST_SOURCE_PATH"
```

`.venv-asr` создаётся заново и не хранится в Git. Версии прямых зависимостей закреплены
в `requirements-asr.txt` и `requirements-asr-cuda.txt`.

## 3. Шрифты

Положить в `~/Library/Fonts/` и в `public/fonts/` проекта:
**Benzin-ExtraBold**, **Gilroy-ExtraBold**, **Gilroy-Light**, **Soyuz Grotesk Bold**.

У всех троих должна быть полная кириллица — проверить перед работой:

```python
from fontTools.ttLib import TTFont
f = TTFont('путь/к/шрифту.ttf', lazy=True)
cm = f.getBestCmap()
print(sum(1 for c in range(0x410, 0x450) if c in cm), '/ 64')
```

Модные шрифты часто идут без кириллицы: Bebas Neue, Boldonse, Big Shoulders,
Bricolage Grotesque — все дают 0 из 64, а движок подменяет их молча.

## 4. HyperFrames

```bash
npx hyperframes skills update
npx hyperframes skills update talking-head-recut
npx hyperframes doctor
```

`doctor` должен показать зелёными ffmpeg, ffprobe и Chrome. TTS и BGM не нужны.

На macOS перед рендером обязательно:

```bash
export PRODUCER_BROWSER_GPU_MODE=hardware
```

Без этого софтверный рендер отваливается по таймауту.

## 5. Remotion (запасной путь для вставок)

```bash
npm i remotion@4.0.484 @remotion/cli@4.0.484 \
      @remotion/paths@4.0.484 @remotion/shapes@4.0.484 \
      @remotion/layout-utils@4.0.484 @remotion/motion-blur@4.0.484 \
      @remotion/captions@4.0.484 @remotion/fonts@4.0.484
```

Версии держать одинаковыми с ядром. Реестр отдаёт новее — не обновлять ради пакетов.

## 6. MCP-серверы

### 21st.dev — компоненты и анимации

Александр просил подключать именно его для анимаций.

```bash
export TWENTY_FIRST_API_KEY='replace-with-your-current-key'

claude mcp add --transport http 21st https://21st.dev/api/mcp \
  --header "x-api-key: ${TWENTY_FIRST_API_KEY}"
```

Либо всё сразу плагином:

```
/plugin marketplace add 21st-dev/claude-code-plugin
/plugin install 21st@21st
```

Проверить: `claude mcp list` — строка `21st ... ✓ Connected`.

Никогда не сохраняйте ключ в Git, даже в приватном репозитории. Используйте переменную
окружения или менеджер секретов. Старый ключ, который когда-то попадал в историю этого
репозитория, необходимо отозвать и выпустить заново. Старый сервер `magic` стоит убрать:
`claude mcp remove magic`.

### Что ещё пригодится

- **FableCut** — браузерный редактор, если нужна ручная правка таймлайна:
  `git clone https://github.com/ronak-create/FableCut.git && node server.js` → localhost:7777.
  Зависимостей нет, `npm install` не нужен.
- **Palmier Pro** — нативный редактор с MCP: `brew install --cask palmier-pro`,
  затем `claude mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp`.
  Русскую речь его расшифровка не понимает — тайминги давать своим транскриптом.

## 7. Проверка, что всё живо

```bash
npx --yes hyperframes@0.8.20 check videos/podcast-reel-pilot
```

На Windows используйте обычный Chrome/Edge без окон `chrome-headless-shell.exe`:

```powershell
.\scripts\check-hyperframes-hidden-windows.ps1 `
  -ProjectDirectory .\videos\podcast-reel-pilot
```

Композиция ожидает локальный исходный клип по media-контракту проекта; бинарный файл
в Git не хранится.

## 8. Сборка ролика

```bash
PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render public -o output.mp4 --fps 30
```

Перед полным рендером — снимок одного кадра:

```bash
npx hyperframes snapshot public --at 24
```

### Windows без всплывающих консолей Chrome

```powershell
.\scripts\render-hyperframes-hidden-windows.ps1 `
  -ProjectDirectory .\videos\podcast-reel-pilot `
  -Output "$env:USERPROFILE\Downloads\reel-final.mp4" `
  -Quality high `
  -Workers 1
```

`high` — рабочий render preset. Reasoning-effort модели (`high`, `xhigh`, `ultra`)
не меняет разрешение или битрейт видео.
