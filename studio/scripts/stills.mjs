// Кадры по номерам для проверки переходов: node scripts/stills.mjs <Composition> <кадр> [кадр …]
// По умолчанию четверть размера (для себя); SCALE=1.5 — полный 4K для показа владельцу. Один браузер на все кадры.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {enableTailwind} from '@remotion/tailwind-v4';

const [id, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve(process.env.ENTRY ?? 'src/index.ts'), webpackOverride: (c) => enableTailwind(c)});
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
for (const f of frames.map(Number)) {
  await renderStill({serveUrl, composition, frame: f, scale: Number(process.env.SCALE ?? 0.25), puppeteerInstance: browser, output: `out/stills/${id}-${String(f).padStart(4, '0')}.png`});
}
await browser.close({silent: true});
console.log(`готово: ${frames.length} кадров в out/stills`);
