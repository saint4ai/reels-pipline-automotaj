# Поднять окружение на новой машине

Проще всего — отдать ссылку на репозиторий Claude Code и попросить подготовить всё по этому файлу:
он сам поставит недостающее и проверит. Пошагово для новичка — [START.md](START.md).

## 0. Одной командой

```bash
# WSL / macOS / Linux
bash scripts/bootstrap-portable.sh            # инструменты + студия Remotion/Storybook + браузер рендера + сторож секретов
bash scripts/bootstrap-portable.sh --codex    # то же + навыки из .claude/skills в Codex
```

```powershell
# Windows / PowerShell (удобнее работать из WSL)
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-portable.ps1 [-Codex]
```

Навыки для Claude Code (`reel-workflow`, `remotion-montage`, `karpathy-guidelines`) лежат в `.claude/skills`
и подхватываются сами; команда `/reel` — в `.claude/commands`.

## 1. Системные зависимости

Node.js ≥ 22, ffmpeg/ffprobe, Python 3.10+; для расшифровки — git, make и компилятор C/C++ (whisper.cpp собирается сам).

- macOS: `brew install node ffmpeg python`
- WSL / Linux: Node.js ≥ 22 (через nvm или пакет), `sudo apt install ffmpeg python3 build-essential git`
- Windows без WSL: Node.js и ffmpeg в PATH

Браузер для рендера Remotion ставит сам: `npx remotion browser ensure` (делает bootstrap).

## 2. Студия

```bash
cd studio && npm ci && npx remotion browser ensure
npm run typecheck
node scripts/qa-fit.mjs FitTest        # обязан FIT FAIL — проверка контейнеров жива
node scripts/qa-fit.mjs Template-Reels # FIT PASS
```

`studio/.npmrc` ставит `legacy-peer-deps`: Storybook рядом с Remotion без него не ставится. Команды студии — `studio/README.md`.

## 3. Запись и расшифровка

```bash
bash scripts/new-video.sh my-video reels /путь/к/записи.mp4     # или youtube
```

Скрипт кладёт запись без кропа в `studio/public/projects/my-video/`, делает пословную расшифровку `videos/my-video/transcript.json`
локальным whisper.cpp через `@remotion/install-whisper-cpp` (при первом запуске сам соберёт whisper.cpp и скачает модель) и заготовку ролика
`studio/src/videos/my-video/`. Для русского нужна многоязычная модель — `medium` по умолчанию или `--model large-v3`;
модели `*.en` понимают только английский. Опечатки в названиях сервисов — в `studio/src/videos/my-video/words.ts`.

## 4. Шрифты, звуки, логотипы

Лежат в `studio/public/`: `fonts/` (Manrope, Inter Tight, JetBrains Mono, Martian Mono, Tektur, Caveat, Handjet),
`sfx/` (нарезки эффектов), `brand/` (настоящие логотипы сервисов), `objects/` (стеклянные 3D-предметы с промптами).
Новый шрифт проверяйте на реальной русской фразе: многие модные шрифты идут без кириллицы.

## 5. Проверка, что всё живо

```bash
cd studio
ENTRY=src/index.ts node scripts/review.mjs Template-YouTube       # листы кадров в out/review/
npx remotion render src/index.ts Template-Reels out/smoke.mp4     # короткий рендер демо (≈ 3–5 мин)
bash scripts/master.sh out/smoke.mp4 out/smoke-final.mp4          # −14 LUFS
```

## 6. MCP-серверы (по желанию)

**21st.dev — компоненты и анимации.** Ключ — в личном кабинете 21st.dev. Не пишите его в чат и не сохраняйте в Git:

```bash
read -rsp "21st key: " K && claude mcp add --scope user --transport http 21st https://21st.dev/api/mcp --header "x-api-key: $K" && unset K
```

Проверить: `claude mcp list` — строка `21st ... ✓ Connected`. Инструменты появятся в новой сессии.

## 7. Когда всё готово — сразу опрос

Установка закончена — агент не ждёт команды, а сам переходит к `docs/agent-contract/WORKFLOW.md`: проверяет модель и усилие
(этап 0), спрашивает формат — рилс или YouTube (этап 1), показывает стили монтажа (этап 2) и дальше ведёт опрос по одному вопросу.
