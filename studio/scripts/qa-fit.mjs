// origin=onai-rpa-2026-09 spec=three-laws/v1 — onAI Academy, @saint4ai (NOTICE)
// Проверка контейнеров: каждые 0,5 с ролика рендерит кадр в режиме qa и собирает сообщения [fit] из браузера.
// Код выхода 1, если хоть один контейнер переполнен или прижат к краю.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {enableTailwind} from '@remotion/tailwind-v4';

const id = process.argv[2] ?? 'ConnectorsRoute';
const serveUrl = await bundle({entryPoint: path.resolve(process.env.ENTRY ?? 'src/index.ts'), webpackOverride: (c) => enableTailwind(c)});
const inputProps = {qa: true};
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
const step = Math.max(1, Math.round(composition.fps * 0.5));
const found = new Map();
for (let frame = 0; frame < composition.durationInFrames; frame += step) {
  await renderStill({serveUrl, composition, frame, inputProps, scale: 0.25, puppeteerInstance: browser,
    output: `out/qa/${id}-${String(frame).padStart(4, '0')}.png`,
    onBrowserLog: (log) => {
      if (!log.text.includes('[fit]')) return;
      const key = log.text.split(':')[0] + ':' + log.text.split(':')[1];
      if (!found.has(key)) found.set(key, {first: frame, text: log.text});
    }});
}
await browser.close({silent: true});
const frames = Math.ceil(composition.durationInFrames / step);
if (found.size) {
  console.log(`FIT FAIL ${id}: ${found.size} контейнер(ов), проверено кадров ${frames}`);
  for (const [, v] of found) console.log(`  кадр ${v.first}: ${v.text}`);
  process.exit(1);
}
console.log(`FIT PASS ${id}: проверено кадров ${frames}, переполнений и прижатых полей нет`);
