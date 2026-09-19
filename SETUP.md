# Поднять окружение на новой машине

Проще всего — отдать ссылку на репозиторий Claude Code и попросить подготовить всё по этому файлу:
он сам поставит недостающее и проверит. Пошагово для новичка — [START.md](START.md).

## 0. Проверка и навыки

```bash
# WSL / macOS / Linux
bash scripts/bootstrap-portable.sh            # проверка инструментов + сторож секретов перед коммитом
bash scripts/bootstrap-portable.sh --codex    # то же + навыки из .claude/skills в Codex
```

```powershell
# Windows / PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-portable.ps1 [-Codex]
```

Навыки для Claude Code (`karpathy-guidelines`, `talking-head-recut`) уже лежат в `.claude/skills`
и подхватываются сами. Внешние навыки маркетинга и копирайтинга для Codex — ключ
`--with-external-skills` (`-WithExternalSkills`), по желанию.

## 1. Системные зависимости

Нужны Node.js ≥ 22, ffmpeg/ffprobe, Python 3.10+, Google Chrome или Chromium.

- macOS: `brew install node ffmpeg`
- Windows: Node.js, Google Chrome и ffmpeg в PATH (удобнее работать из WSL).
- WSL / Linux: Node.js ≥ 22 (через nvm или пакет), `sudo apt install ffmpeg python3`, Chrome/Chromium.

Проверка: `node -v`, `ffmpeg -version`, `python3 --version`.

## 2. Запись и расшифровка

```bash
bash scripts/new-reel.sh my-reel
bash scripts/prepare-media.sh videos/my-reel /путь/к/записи.mp4
```

`prepare-media.sh` делает копию записи без кропа с опорным кадром каждые 30 кадров, отдельную
дорожку речи и пословную расшифровку `videos/my-reel/transcript.json` локальным whisper через
`hyperframes transcribe` (модель скачается при первом запуске). Для русского нужна многоязычная
модель — `medium` по умолчанию или `--model large-v3`; модели `*.en` понимают только английский.
После расшифровки поправьте опечатки в названиях сервисов прямо в `transcript.json`.

## 3. Шрифты

Открытые шрифты системы лежат в `fonts/` (лицензия OFL-1.1, тексты лицензий рядом):
Manrope, JetBrains Mono, STIX Two Text Italic. `new-reel.sh` сам кладёт их в проект через
`bash scripts/fonts.sh videos/<project>`. Benzin — запасной заголовок, проприетарный, в репозиторий
не входит; без него используется Manrope.

Модные шрифты часто идут без кириллицы (Bebas Neue, Boldonse, Big Shoulders, Bricolage Grotesque) —
браузер подменяет их молча. Новый шрифт проверяйте на реальной русской фразе.

## 4. HyperFrames

```bash
npx --yes hyperframes@0.8.20 doctor
```

`doctor` должен показать зелёными Node.js, ffmpeg, ffprobe и whisper-cpp. Docker, TTS (Kokoro) и музыка (MusicGen)
для этого пайплайна не нужны — их красные строки можно не замечать.

На macOS перед рендером обязательно `export PRODUCER_BROWSER_GPU_MODE=hardware` — без этого
софтверный рендер отваливается по таймауту.

## 5. Remotion (запасной путь для вставок)

```bash
npm i remotion@4.0.484 @remotion/cli@4.0.484 \
      @remotion/paths@4.0.484 @remotion/shapes@4.0.484 \
      @remotion/layout-utils@4.0.484 @remotion/motion-blur@4.0.484 \
      @remotion/captions@4.0.484 @remotion/fonts@4.0.484
```

Версии держать одинаковыми с ядром.

## 6. MCP-серверы (по желанию)

### 21st.dev — компоненты и анимации

Ключ — в личном кабинете 21st.dev. Не пишите его в чат и не сохраняйте в Git:

```bash
read -rsp "21st key: " K && claude mcp add --scope user --transport http 21st https://21st.dev/api/mcp --header "x-api-key: $K" && unset K
```

Проверить: `claude mcp list` — строка `21st ... ✓ Connected`. Инструменты появятся в новой сессии.

### Что ещё пригодится

- **FableCut** — браузерный редактор для ручной правки таймлайна:
  `git clone https://github.com/ronak-create/FableCut.git && node server.js` → localhost:7777.
- **Palmier Pro** — нативный редактор с MCP (macOS). Русскую речь его расшифровка не понимает —
  тайминги давать своим `transcript.json`.

## 7. Проверка, что всё живо

```bash
bash scripts/new-reel.sh smoke-test
bash scripts/prepare-media.sh videos/smoke-test /путь/к/любой/вертикальной/записи.mp4
python3 scripts/pipe.py state videos/smoke-test
python3 scripts/pipe.py lint  videos/smoke-test
```

## 8. Сборка и рендер

```bash
python3 scripts/pipe.py build videos/<project>                      # сборка + проверки + лист снимков
bash scripts/render-safe.sh videos/<project> renders/out.mp4        # рендер с проверкой файла
```

Windows без всплывающих окон Chrome:

```powershell
.\scripts\render-hyperframes-hidden-windows.ps1 `
  -ProjectDirectory .\videos\<project> `
  -Output "$env:USERPROFILE\Downloads\reel-final.mp4" `
  -Quality high `
  -Workers 1
```

`high` — рабочий пресет качества. Уровень рассуждения модели не меняет разрешение или битрейт видео.
