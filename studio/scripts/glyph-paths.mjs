// Контуры текста для пролёта сквозь букву (ролик 21): node scripts/glyph-paths.mjs <текст> <wght> <out.json>
// Вариативный Inter Tight в нужной толщине (fontkit.getVariation), координаты в единицах шрифта, ось y вниз (как в SVG).
// Для каждого знака — внешний контур и отверстия отдельно: отверстие нуля — окно, в которое летит камера.
import fs from 'node:fs';
import * as fontkit from 'fontkit';
const [text = '100K', wght = '900', out = 'src/kit/liquid/glyphs/intertight-900-100K.json'] = process.argv.slice(2);
const base = fontkit.openSync('public/fonts/InterTight-Variable.ttf');
const font = base.getVariation({wght: Number(wght)});
const run = font.layout(text);
const f = (v) => Math.round(v * 10) / 10;
let x = 0;
const glyphs = run.glyphs.map((g, i) => {
  const contours = [];
  let cur = null;
  for (const c of g.path.commands) {
    const a = c.args.map((v, j) => f(j % 2 ? -v : v));
    if (c.command === 'moveTo') { cur = {d: `M${a}`, pts: [a]}; contours.push(cur); }
    else if (c.command === 'lineTo') { cur.d += `L${a}`; cur.pts.push(a); }
    else if (c.command === 'quadraticCurveTo') { cur.d += `Q${a}`; cur.pts.push(a.slice(2)); }
    else if (c.command === 'bezierCurveTo') { cur.d += `C${a}`; cur.pts.push(a.slice(4)); }
    else if (c.command === 'closePath') cur.d += 'Z';
  }
  const box = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
  const cs = contours.map((c) => ({d: c.d, box: box(c.pts)}));
  const res = {char: text[i], x: f(x), adv: f(run.positions[i].xAdvance), contours: cs};
  x += run.positions[i].xAdvance;
  return res;
});
fs.writeFileSync(out, JSON.stringify({text, wght: Number(wght), upm: font.unitsPerEm, ascent: font.ascent, descent: font.descent, capHeight: font.capHeight, width: f(x), glyphs}, null, 1));
console.log(out, 'width', f(x), 'upm', font.unitsPerEm, glyphs.map((g) => `${g.char}:${g.contours.length}`).join(' '));
