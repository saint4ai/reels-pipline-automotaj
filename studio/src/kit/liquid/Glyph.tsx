import {useId} from 'react';

// Текст из настоящих контуров шрифта (scripts/glyph-paths.mjs → glyphs/*.json): вектор остаётся чётким при зуме ×60,
// а отверстие буквы (например, нуля) — точное окно для пролёта камеры сквозь букву (паттерн 9, переход glyphZoom).
export type GlyphJson = {text: string; upm: number; width: number; glyphs: {char: string; x: number; adv: number; contours: {d: string; box: number[]}[]}[]};

// Положение текста: левый край x, базовая линия y, кегль size (px на em).
export type GlyphPlace = {x: number; y: number; size: number};

const scalePath = (d: string, s: number, dx: number, dy: number) =>
  (d.match(/[MLQCZ][^MLQCZ]*/g) ?? []).map((tok) => {
    const n = tok.slice(1).split(',').filter(Boolean).map(Number);
    const pts: string[] = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push(`${(dx + n[i] * s).toFixed(2)} ${(dy + n[i + 1] * s).toFixed(2)}`);
    return tok[0] + pts.join(' ');
  }).join(' ');

// Отверстие знака gi (самый маленький контур) в координатах кадра, с зумом камеры Z вокруг точки (cx, cy).
export const holeBox = (g: GlyphJson, gi: number, p: GlyphPlace) => {
  const s = p.size / g.upm, gl = g.glyphs[gi];
  const hole = [...gl.contours].sort((a, b) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) - (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]))[0];
  const [x0, y0, x1, y1] = hole.box;
  return {x0: p.x + (gl.x + x0) * s, y0: p.y + y0 * s, x1: p.x + (gl.x + x1) * s, y1: p.y + y1 * s, d: hole.d, gx: gl.x};
};
export const holePath = (g: GlyphJson, gi: number, p: GlyphPlace, Z = 1, cx = 0, cy = 0) => {
  const s = p.size / g.upm, gl = g.glyphs[gi];
  const hole = [...gl.contours].sort((a, b) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) - (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]))[0];
  // точка кадра q = c + Z * (p - c)
  return scalePath(hole.d, s * Z, cx + (p.x + gl.x * s - cx) * Z, cy + (p.y - cy) * Z);
};

// Весь текст контурами: светлая заливка с градиентом и выдавленная тёмная подложка (глубина), цвет знака — по индексу.
export const GlyphText: React.FC<{g: GlyphJson; p: GlyphPlace; fill?: (i: number) => [string, string]; depth?: number; w?: number; h?: number}> =
  ({g, p, fill = () => ['#FFFFFF', '#C9CED4'], depth, w = 1440, h = 2560}) => {
    const id = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const s = p.size / g.upm;
    const dep = depth ?? Math.max(4, Math.round(p.size / 40));
    return (
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          {g.glyphs.map((_, i) => {
            const [a, b] = fill(i);
            return <linearGradient key={i} id={`${id}${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>;
          })}
          <filter id={`${id}sh`} x="-10%" y="-10%" width="120%" height="140%"><feGaussianBlur stdDeviation={p.size / 22} /></filter>
        </defs>
        {g.glyphs.map((gl, i) => {
          const d = gl.contours.map((c) => scalePath(c.d, s, p.x + gl.x * s, p.y)).join(' ');
          return (
            <g key={i}>
              <path d={d} fillRule="evenodd" fill="rgba(0,0,0,.55)" transform={`translate(0 ${dep + p.size / 18})`} filter={`url(#${id}sh)`} />
              {Array.from({length: dep}, (_, q) => <path key={q} d={d} fillRule="evenodd" fill="#2E3238" transform={`translate(0 ${q + 1})`} />)}
              <path d={d} fillRule="evenodd" fill={`url(#${id}${i})`} />
            </g>
          );
        })}
      </svg>
    );
  };
