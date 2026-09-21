// origin=onai-rpa-2026-09 spec=three-laws/v1 — onAI Academy, @saint4ai (NOTICE)
// Пословная расшифровка записи на whisper.cpp через @remotion/install-whisper-cpp (путь Remotion, без сторонних CLI).
//   node scripts/transcribe.mjs <запись.mp4|wav> <out.json> [--model medium] [--lang ru]
// Первый запуск сам ставит whisper.cpp в studio/.whisper и скачивает модель (medium ≈ 1,5 ГБ). Для русского нужна
// многоязычная модель: medium (по умолчанию) или large-v3; модели *.en понимают только английский.
// Выход — [{text, start, end}] в секундах, по слову.
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import {downloadWhisperModel, installWhisperCpp, transcribe} from '@remotion/install-whisper-cpp';

const [src, out, ...rest] = process.argv.slice(2);
if (!src || !out) { console.error('укажи запись и файл результата'); process.exit(2); }
const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i >= 0 ? rest[i + 1] : d; };
const model = opt('model', 'medium'), lang = opt('lang', 'ru');
const dir = path.resolve('.whisper'), version = '1.5.5';
await installWhisperCpp({to: dir, version, printOutput: false});
await downloadWhisperModel({model, folder: dir, printOutput: false});
// whisper.cpp принимает только 16 кГц моно WAV
const wav = path.join(mkdtempSync(path.join(os.tmpdir(), 'asr-')), 'input-16k.wav');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
const {transcription} = await transcribe({inputPath: wav, whisperPath: dir, whisperCppVersion: version, model, language: lang,
  tokenLevelTimestamps: true, printOutput: false, splitOnWord: true});
// токены → слова: токен с пробелом в начале открывает новое слово, служебные [_…] пропускаются
const words = [];
for (const seg of transcription) {
  for (const tok of seg.tokens ?? []) {
    const text = tok.text;
    if (!text || /^\[_/.test(text) || /^\s*$/.test(text)) continue;
    const s = tok.offsets.from / 1000, e = tok.offsets.to / 1000;
    if (text.startsWith(' ') || !words.length) words.push({text: text.trim(), start: s, end: e});
    else { const w = words[words.length - 1]; w.text += text; w.end = e; }
  }
}
const clean = words.filter((w) => w.text).map((w) => ({text: w.text, start: +w.start.toFixed(2), end: +Math.max(w.end, w.start + 0.05).toFixed(2)}));
writeFileSync(out, JSON.stringify(clean, null, 1));
console.log(`готово: ${clean.length} слов → ${out}`);
