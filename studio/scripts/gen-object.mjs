// Генерация предметов через OpenAI Images по ключу владельца. Ключ берётся из OPENAI_API_KEY или ~/.config/onai/openai_key
// и нигде не печатается. Картинка (WebP с прозрачностью, 768 px) и её промпт сохраняются рядом:
// public/objects/<name>.webp и <name>.prompt.txt.
// node scripts/gen-object.mjs <name> "<промпт>" [--model gpt-image-…] [--size 1024x1536] [--quality high] [--bg transparent]
// Без --model берётся самая новая модель gpt-image-* из /v1/models (список печатается).
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [name, prompt, ...rest] = process.argv.slice(2);
if (!name || !prompt) { console.error('нужно: <name> "<промпт>"'); process.exit(1); }
const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i >= 0 ? rest[i + 1] : d; };
const keyFile = path.join(os.homedir(), '.config/onai/openai_key');
const key = process.env.OPENAI_API_KEY || (existsSync(keyFile) ? readFileSync(keyFile, 'utf8').trim() : '');
if (!key) { console.error('нет ключа: задай OPENAI_API_KEY или положи ключ в ~/.config/onai/openai_key'); process.exit(2); }
const H = {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'};

let model = opt('model');
if (!model) {
  const j = await (await fetch('https://api.openai.com/v1/models', {headers: H})).json();
  const list = (j.data ?? []).filter((m) => /^gpt-image/.test(m.id)).sort((a, b) => b.created - a.created);
  console.log('модели изображений:', list.map((m) => m.id).join(', ') || 'нет');
  model = list[0]?.id;
  if (!model) process.exit(3);
}
const body = {model, prompt, size: opt('size', '1024x1536'), quality: opt('quality', 'high'), background: opt('bg', 'transparent'), output_format: 'png', n: 1};
const gen = async (b) => { const r = await fetch('https://api.openai.com/v1/images/generations', {method: 'POST', headers: H, body: JSON.stringify(b)}); return {r, j: await r.json()}; };
let {r, j} = await gen(body);
// Если модель не умеет прозрачный фон — повтор с фоном по умолчанию (потом вырезаем).
if (!r.ok && /background/i.test(j.error?.message ?? '')) { body.background = 'auto'; ({r, j} = await gen(body)); }
if (!r.ok) { console.error('ошибка', r.status, j.error?.message); process.exit(4); }
const dir = path.resolve('public/objects');
mkdirSync(dir, {recursive: true});
const png = path.join(dir, `${name}.png`);
writeFileSync(png, Buffer.from(j.data[0].b64_json, 'base64'));
// WebP с альфой в 15 раз легче PNG, качество для кадра то же
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=768:-1:flags=lanczos', '-c:v', 'libwebp', '-quality', '88', '-pix_fmt', 'yuva420p', path.join(dir, `${name}.webp`)]);
unlinkSync(png);
writeFileSync(path.join(dir, `${name}.prompt.txt`), `${model} · ${body.size} · ${body.quality} · фон ${body.background}\n\n${prompt}\n`);
console.log('готово:', `public/objects/${name}.webp`, model, j.usage ? JSON.stringify(j.usage) : '');
