#!/usr/bin/env bash
# Новый ролик на студии Remotion: папка проекта, запись спикера в studio/public, пословная расшифровка,
# данные ролика и своя точка входа в студии.
#   bash scripts/new-video.sh <id> <reels|youtube> [/путь/к/записи.mp4] [--model medium] [--lang ru]
# id — латиница, цифры и дефис (так требует Remotion). Без записи создаётся заготовка, запись можно добавить позже
# тем же вызовом.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ID="${1:?укажи id проекта: латиница, цифры, дефис}"
FORMAT="${2:?укажи формат: reels или youtube}"
SRC="${3:-}"
shift $(( $# >= 3 ? 3 : $# ))
model=medium; lang=ru
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) model="$2"; shift 2 ;;
    --lang) lang="$2"; shift 2 ;;
    *) echo "неизвестный ключ: $1" >&2; exit 2 ;;
  esac
done
[[ "$ID" =~ ^[a-zA-Z0-9-]+$ ]] || { echo "id только из латиницы, цифр и дефиса: $ID" >&2; exit 2; }
[[ "$FORMAT" == reels || "$FORMAT" == youtube ]] || { echo "формат: reels или youtube" >&2; exit 2; }

P="$ROOT/videos/$ID"; S="$ROOT/studio"; PUB="$S/public/projects/$ID"; CODE="$S/src/videos/$ID"
mkdir -p "$P"/{assets,media,renders} "$PUB" "$CODE"

W=0; H=0; DUR=20
if [[ -n "$SRC" ]]; then
  [[ -f "$SRC" ]] || { echo "нет файла записи: $SRC" >&2; exit 2; }
  echo "1/3 запись без кропа → studio/public/projects/$ID/speaker.mp4"
  ffmpeg -v error -y -i "$SRC" -map 0:v:0 -map 0:a:0? -c:v libx264 -crf 16 -preset medium -g 30 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$PUB/speaker.mp4"
  ffmpeg -v error -y -i "$SRC" -map 0:a:0 -vn -ac 1 -ar 16000 "$P/media/asr.wav"
  echo "2/3 пословная расшифровка (whisper $model, $lang) → videos/$ID/transcript.json"
  # распознавание речи — локальный whisper из CLI HyperFrames; рендер при этом идёт на Remotion
  npx --yes hyperframes@0.8.20 transcribe "$P/media/asr.wav" -d "$P" -m "$model" -l "$lang"
  IFS=x read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$PUB/speaker.mp4")
  DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$PUB/speaker.mp4")"
fi

echo "3/3 данные ролика и точка входа → studio/src/videos/$ID/"
python3 - "$P" "$CODE" "$ID" "$FORMAT" "$W" "$H" "$DUR" <<'PY'
import json, os, sys
p, code, pid, fmt, w, h, dur = sys.argv[1:8]
w, h, dur = int(w), int(h), round(float(dur), 2)
tr = os.path.join(p, 'transcript.json')
words = json.load(open(tr, encoding='utf-8')) if os.path.exists(tr) else []
words = [{'text': x['text'].strip(), 'start': round(x['start'], 2), 'end': round(x['end'], 2)} for x in words if x.get('text', '').strip()]
open(os.path.join(code, 'words.ts'), 'w', encoding='utf-8').write(
  '// Пословная расшифровка записи (videos/%s/transcript.json). Опечатки в названиях сервисов правь здесь.\n' % pid +
  'import type {Word} from \'../../template/demo\';\nexport const WORDS: Word[] = ' + json.dumps(words, ensure_ascii=False, indent=1) + ';\n')
proj = os.path.join(code, 'project.ts')
if not os.path.exists(proj):
  speaker = f"{{src: 'projects/{pid}/speaker.mp4', w: {w}, h: {h}}}" if w else 'undefined'
  open(proj, 'w', encoding='utf-8').write(f"""import type {{ProjectData}} from '../../template/demo';
import {{WORDS}} from './words';

// Данные ролика {pid}. Блоки — по карте монтажа из videos/{pid}/DIRECTION.md: секунда приезда камеры (at) = начало фразы.
// Это стартовая заготовка на шаблоне «сценарный канвас»; под выбранный стиль агент пишет свои сцены рядом (scenes.tsx).
export const PROJECT: ProjectData = {{
  duration: {dur},
  words: WORDS,
  speaker: {speaker},
  plan: [],
  blocks: [
    {{kind: 'hook', id: 'hook', label: '01 · хук', at: 0, tone: 'light', lines: ['Первая строка', 'хука'], object: 'scissors'}},
    {{kind: 'cta', id: 'cta', label: '02 · призыв', at: {max(3.0, round(dur - 5, 2))}, note: 'Напиши кодовое слово', word: 'гоу', typeAt: {max(4.0, round(dur - 3.6, 2))}}},
  ],
}};
""")
open(os.path.join(code, 'index.tsx'), 'w', encoding='utf-8').write(f"""import {{registerRoot}} from 'remotion';
import {{Composition}} from 'remotion';
import '../../index.css';
import '../../fonts';
import {{calcTemplate, Template}} from '../../template/Template';
import {{PROJECT}} from './project';

// Своя точка входа ролика: общий Root.tsx не трогаем.
// Кадры: cd studio && ENTRY=src/videos/{pid}/index.tsx node scripts/review.mjs {pid}
// Рендер: cd studio && npx remotion render src/videos/{pid}/index.tsx {pid} ../videos/{pid}/renders/raw.mp4
const Root: React.FC = () => (
  <Composition id="{pid}" component={{Template}} defaultProps={{{{format: '{fmt}' as const, project: PROJECT}}}} calculateMetadata={{calcTemplate}}
    durationInFrames={{60}} fps={{60}} width={{{1440 if fmt == 'reels' else 2560}}} height={{{2560 if fmt == 'reels' else 1440}}} />
);
registerRoot(Root);
""")
print(f'проект {pid}: формат {fmt}, {len(words)} слов, {dur} с')
PY
echo "Готово. Дальше: опечатки в studio/src/videos/$ID/words.ts → карта монтажа в videos/$ID/DIRECTION.md → блоки в project.ts."
