// Снимок настоящей веб-страницы через браузер Remotion (консольный режим Chrome в WSL зависает).
// node shot.mjs <url> <out.png> [ширина] [высота] [dark]
import {openBrowser} from '@remotion/renderer';
import {writeFileSync} from 'node:fs';
const [url, out, w = '1280', h = '2000', theme = 'dark'] = process.argv.slice(2);
const browser = await openBrowser('chrome');
const page = await browser.newPage({context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {}});
await page.setViewport({width: +w, height: +h, deviceScaleFactor: 2});
if (theme === 'dark') await page._client().send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-color-scheme', value: 'dark'}]});
await page.goto({url, timeout: 45000});
await new Promise((r) => setTimeout(r, 3000));
const res = await page._client().send('Page.captureScreenshot', {format: 'png'});
const data = res.data ?? res.value?.data;
writeFileSync(out, Buffer.from(data, 'base64'));
await browser.close({silent: true});
console.log('ok', out);
