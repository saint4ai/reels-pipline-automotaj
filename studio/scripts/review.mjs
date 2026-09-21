// Листы кадров для владельца: кадр каждые STEP секунд (по умолчанию 2) + последний, номера К001, К002… с таймкодом.
//   ENTRY=src/videos/<id>/index.tsx node scripts/review.mjs <Composition> [шаг]
// Кадры — out/review/<Composition>/K###.png, листы по 6 — out/review/<Composition>-sheet-N.jpg. Показывать листами, не по кадру.
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {enableTailwind} from '@remotion/tailwind-v4';

const [id, stepArg] = process.argv.slice(2);
if (!id) { console.error('укажи композицию'); process.exit(2); }
const step = Number(stepArg ?? 2);
const serveUrl = await bundle({entryPoint: path.resolve(process.env.ENTRY ?? 'src/index.ts'), webpackOverride: (c) => enableTailwind(c)});
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
const {fps, durationInFrames} = composition;
const frames = [];
for (let s = 0; s * fps < durationInFrames - 1; s += step) frames.push(Math.round(s * fps));
frames.push(durationInFrames - 1);
const dir = `out/review/${id}`;
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const shots = [];
for (const [i, f] of frames.entries()) {
  const out = `${dir}/K${String(i + 1).padStart(3, '0')}.png`;
  await renderStill({serveUrl, composition, frame: f, scale: Number(process.env.SCALE ?? 0.3), puppeteerInstance: browser, output: out});
  shots.push({out, label: `К${String(i + 1).padStart(3, '0')} ${(f / fps).toFixed(1)}с`});
}
await browser.close({silent: true});
const per = composition.width > composition.height ? 3 : 6;
for (let i = 0; i * per < shots.length; i++) {
  const part = shots.slice(i * per, (i + 1) * per);
  execFileSync('bash', ['scripts/sheet.sh', `out/review/${id}-sheet-${i + 1}.jpg`, String(Math.min(per, part.length)), ...part.flatMap((s) => [s.label, s.out])]);
}
console.log(`готово: ${shots.length} кадров, ${Math.ceil(shots.length / per)} листов в out/review/`);
