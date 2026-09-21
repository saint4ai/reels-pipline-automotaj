import {useId} from 'react';
import {EnvProvider} from '../kit/liquid/env';
import type {Box, Format} from '../formats';
import {NEON, NOISE, useFormat} from './canvas';

// Стол и листы холста. Каждый смысловой блок — лист размером в кадр; карточка на листе — плита с торцом, фаской,
// тетрадной сеткой и неоновой кромкой, которая вспыхивает, когда приезжает камера. Листы идут змейкой по 3 в ряд,
// между ними стол, поэтому соседние карточки не пересекаются, а пунктир обходит их по краю.
export type Ruling = 'grid' | 'big' | 'mm' | 'dots' | 'cells';
export type Tone = 'dark' | 'light';
export type Page = {id: string; col: number; row: number; x: number; y: number; ruling: Ruling; tone: Tone; label: string; at: number; shape?: Box; full?: boolean};

const RULINGS: Ruling[] = ['grid', 'cells', 'mm', 'dots', 'big'];
// Раскладка змейкой: ряд 0 слева направо, ряд 1 справа налево и так далее.
export const layoutPages = (f: Format, items: {id: string; label: string; at: number; tone?: Tone; shape?: Box; full?: boolean}[]): Page[] =>
  items.map((it, i) => {
    const row = Math.floor(i / 3), c = i % 3, col = row % 2 === 0 ? c : 2 - c;
    return {...it, col, row, x: col * f.step.x, y: row * f.step.y, ruling: RULINGS[i % RULINGS.length], tone: it.tone ?? (i % 3 === 2 ? 'light' : 'dark')};
  });

export const cardRect = (f: Format, p: Page): Box => (p.full ? {x: 0, y: 0, w: f.w, h: f.h} : p.shape ?? f.card);
export const center = (f: Format, p: Page) => ({cx: p.x + f.w / 2, cy: p.y + f.h / 2});

const texture = (r: Ruling, light: boolean): React.CSSProperties => {
  const a = light ? 'rgba(20,24,28,' : 'rgba(255,255,255,';
  const grid = (step: number, alpha: string, wpx = 2) => ({
    backgroundImage: [`linear-gradient(${a}${alpha}) ${wpx}px, transparent ${wpx}px)`, `linear-gradient(90deg, ${a}${alpha}) ${wpx}px, transparent ${wpx}px)`].join(','),
    backgroundSize: `${step}px ${step}px`,
  });
  switch (r) {
    case 'dots': return {backgroundImage: `${grid(72, '.05', 1).backgroundImage}, radial-gradient(circle, ${a}.14) 3px, transparent 3.6px)`, backgroundSize: '72px 72px, 72px 72px, 72px 72px'};
    case 'cells': return grid(96, '.075');
    case 'mm': return {backgroundImage: [`linear-gradient(${a}.11) 2px, transparent 2px)`, `linear-gradient(90deg, ${a}.11) 2px, transparent 2px)`,
      `linear-gradient(${a}.045) 1px, transparent 1px)`, `linear-gradient(90deg, ${a}.045) 1px, transparent 1px)`].join(','),
      backgroundSize: '150px 150px, 150px 150px, 25px 25px, 25px 25px'};
    case 'big': return grid(180, '.09', 3);
    default: return grid(64, '.07');
  }
};

// Кусок мира: стол (графит, шум, редкая сетка) и все карточки, попавшие в прямоугольник x0,y0,w,h.
// Рисуется и как сам стол, и как копия фона для стекла внутри листа.
export const CanvasBg: React.FC<{f: Format; pages: Page[]; x0: number; y0: number; w: number; h: number; hot?: (p: Page) => number}> = ({f, pages, x0, y0, w, h, hot}) => {
  const near = (p: Page, m: number) => p.x + f.w + m > x0 && p.x - m < x0 + w && p.y + f.h + m > y0 && p.y - m < y0 + h;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 30%, #16191D 0%, #0D0F12 60%, #08090B 100%)'}}>
      {pages.filter((p) => near(p, 400)).map((p) => {
        const r = cardRect(f, p);
        return <div key={`z${p.id}`} style={{position: 'absolute', left: p.x + r.x - 260 - x0, top: p.y + r.y - 260 - y0, width: r.w + 520, height: r.h + 520,
          background: `radial-gradient(closest-side, rgba(${NEON.rgb},.10), rgba(${NEON.rgb},0) 75%)`}} />;
      })}
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)',
        backgroundSize: '120px 120px', backgroundPosition: `${-x0}px ${-y0}px`}} />
      {pages.filter((p) => near(p, 200)).map((p) => {
        const r = cardRect(f, p), light = p.tone === 'light', g = hot ? hot(p) : 0, R2 = p.full ? 0 : 46;
        return (
          <div key={p.id} style={{position: 'absolute', left: p.x + r.x - x0, top: p.y + r.y - y0, width: r.w, height: r.h}}>
            {/* торец плиты — один чистый слой тени, без размытых эллипсов */}
            {!p.full ? <div style={{position: 'absolute', left: 0, top: 16, width: r.w, height: r.h, borderRadius: R2, background: light ? '#B7B2A7' : '#05070A',
              boxShadow: '0 26px 60px rgba(0,0,0,.55)'}} /> : null}
            <div style={{position: 'absolute', inset: 0, borderRadius: R2, overflow: 'hidden',
              background: light ? 'radial-gradient(120% 90% at 30% 10%, #FFFFFF 0%, #EDEAE2 100%)' : 'radial-gradient(120% 90% at 30% 10%, #262B31 0%, #0E1114 100%)',
              boxShadow: p.full ? 'none' : `inset 0 3px 0 rgba(255,255,255,${light ? 0.95 : 0.22}), inset 0 -6px 18px rgba(0,0,0,${light ? 0.12 : 0.45})`}}>
              <div style={{position: 'absolute', inset: 0, ...texture(p.ruling, light)}} />
              <div style={{position: 'absolute', inset: 0, background: light
                ? `radial-gradient(95% 55% at 50% -5%, rgba(255,255,255,.95), transparent 62%), radial-gradient(85% 60% at 50% 0%, rgba(${NEON.rgb},${0.04 + 0.16 * g}), transparent 70%)`
                : `radial-gradient(95% 55% at 50% -5%, rgba(255,255,255,.08), transparent 58%), radial-gradient(85% 65% at 50% 0%, rgba(${NEON.rgb},${0.07 + 0.3 * g}), transparent 70%)`}} />
              <div style={{position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '300px 300px', opacity: light ? 0.05 : 0.09, mixBlendMode: 'overlay'}} />
              {g > 0.02 ? <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: Math.min(1, g * 1.4),
                background: 'linear-gradient(104deg, transparent 34%, rgba(255,255,255,.45) 48%, rgba(190,220,255,.2) 54%, transparent 66%)',
                backgroundSize: '260% 100%', backgroundPosition: `${170 - g * 240}% 0`}} /> : null}
            </div>
            {!p.full ? <div style={{position: 'absolute', inset: 0, borderRadius: R2, pointerEvents: 'none',
              boxShadow: `0 0 0 ${2 + 5 * g}px rgba(${NEON.rgb},${0.18 + 0.8 * g}), 0 0 ${30 + 120 * g}px rgba(${NEON.rgb},${0.08 + 0.55 * g})`}} /> : null}
          </div>
        );
      })}
    </div>
  );
};

// Комета бежит по кромке карточки, пока та подсвечена.
export const CardSpark: React.FC<{p: Page; g: number}> = ({p, g}) => {
  const f = useFormat();
  if (g <= 0.02 || p.full) return null;
  const r = cardRect(f, p), per = 2 * (r.w + r.h), d = ((1 - g) * per * 1.6) % per;
  let x = 0, y = 0;
  if (d < r.w) { x = d; } else if (d < r.w + r.h) { x = r.w; y = d - r.w; }
  else if (d < 2 * r.w + r.h) { x = r.w - (d - r.w - r.h); y = r.h; } else { y = r.h - (d - 2 * r.w - r.h); }
  return <div style={{position: 'absolute', left: p.x + r.x + x - 26, top: p.y + r.y + y - 26, width: 52, height: 52, borderRadius: 26, opacity: g,
    background: `radial-gradient(circle, #FFFFFF 0%, rgba(${NEON.rgb},.9) 40%, rgba(${NEON.rgb},0) 70%)`}} />;
};

export const Desk: React.FC<{pages: Page[]; cx: number; cy: number; s: number; hot?: (p: Page) => number}> = ({pages, cx, cy, s, hot}) => {
  const f = useFormat();
  const w = f.w / s + 400, h = f.h / s + 400;
  const x0 = Math.floor(cx - w / 2), y0 = Math.floor(cy - h / 2);
  return <div style={{position: 'absolute', left: x0, top: y0}}><CanvasBg f={f} pages={pages} x0={x0} y0={y0} w={Math.ceil(w)} h={Math.ceil(h)} hot={hot} /></div>;
};

// Содержимое листа: координаты внутри листа (0…w, 0…h кадра), жёсткая обрезка по карточке — ничего не вылезает за контейнер.
export const Sheet: React.FC<{pages: Page[]; p: Page; o?: number; hot?: (q: Page) => number; children?: React.ReactNode}> = ({pages, p, o = 1, hot, children}) => {
  const f = useFormat();
  const r = cardRect(f, p);
  return (
    <div style={{position: 'absolute', left: p.x, top: p.y, width: f.w, height: f.h, opacity: o}}>
      <EnvProvider w={f.w} h={f.h} bg={() => <CanvasBg f={f} pages={pages} x0={p.x} y0={p.y} w={f.w} h={f.h} hot={hot} />}>
        <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: p.full ? 0 : 44, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -r.x, top: -r.y, width: f.w, height: f.h}}>{children}</div>
        </div>
      </EnvProvider>
    </div>
  );
};

export const PageLabel: React.FC<{p: Page; o?: number}> = ({p, o = 1}) => {
  const f = useFormat();
  if (p.full || o <= 0) return null;
  const r = cardRect(f, p);
  return (
    <div style={{position: 'absolute', left: p.x + r.x + 8, top: p.y + r.y - 92, display: 'flex', alignItems: 'center', gap: 20, opacity: o, whiteSpace: 'nowrap',
      fontFamily: 'Manrope', fontWeight: 700, fontSize: 56, color: '#7E848A'}}>
      <span style={{width: 28, height: 28, borderRadius: 8, border: '5px solid #7E848A'}} />{p.label}
    </div>
  );
};

// Связка между листами: из боковой кромки (тот же ряд) или снизу (следующий ряд) — в верхнюю середину следующей карточки.
// Маршрут идёт по столу в обход карточек.
export type Link = {pts: [number, number][]};
export const linkOf = (f: Format, a: Page, b: Page): Link => {
  const ra = cardRect(f, a), rb = cardRect(f, b);
  const ax = a.x + ra.x, ay = a.y + ra.y, bx = b.x + rb.x, by = b.y + rb.y;
  const bTop: [number, number] = [bx + rb.w / 2, by];
  if (b.row === a.row) {
    const right = b.x > a.x;
    const side: [number, number] = [right ? ax + ra.w : ax, ay + ra.h * 0.5];
    const gap = right ? (bx + ax + ra.w) / 2 : (ax + bx + rb.w) / 2;
    const bus = Math.min(ay, by) - 260;
    return {pts: [side, [gap, side[1]], [gap, bus], [bTop[0], bus], bTop]};
  }
  const bottom: [number, number] = [ax + ra.w / 2, ay + ra.h];
  const mid = (bottom[1] + by) / 2;
  return {pts: [bottom, [bottom[0], mid], [bTop[0], mid], bTop]};
};
const lens = (pts: [number, number][]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
export const linkPoint = (l: Link, u: number): [number, number] => {
  const L = lens(l.pts);
  let d = Math.max(0, Math.min(1, u)) * L.reduce((s, v) => s + v, 0);
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) {
      const p = L[i] ? d / L[i] : 0, a = l.pts[i], b = l.pts[i + 1];
      return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
    }
    d -= L[i];
  }
  return l.pts[l.pts.length - 1];
};
const pathOf = (pts: [number, number][]) => {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1];
    const va = Math.hypot(p[0] - a[0], p[1] - a[1]), vb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const r = Math.min(70, va / 2, vb / 2);
    d += ` L${p[0] + ((a[0] - p[0]) / va) * r},${p[1] + ((a[1] - p[1]) / va) * r} Q${p[0]},${p[1]} ${p[0] + ((b[0] - p[0]) / vb) * r},${p[1] + ((b[1] - p[1]) / vb) * r}`;
  }
  const e = pts[pts.length - 1];
  return `${d} L${e[0]},${e[1]}`;
};
export const Connector: React.FC<{l: Link; draw: number; ghost?: number; sw?: number}> = ({l, draw, ghost = 0, sw = 8}) => {
  const id = 'cn' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (draw <= 0 && ghost <= 0) return null;
  const xs = l.pts.map((p) => p[0]), ys = l.pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 120, minY = Math.min(...ys) - 120, maxX = Math.max(...xs) + 120, maxY = Math.max(...ys) + 120;
  const d = pathOf(l.pts.map((p) => [p[0] - minX, p[1] - minY]) as [number, number][]);
  const p = Math.min(1, Math.max(0.001, draw));
  const tip = linkPoint(l, p), pre = linkPoint(l, Math.max(0, p - 0.015));
  const ang = (Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) * 180) / Math.PI;
  const C = `rgb(${NEON.rgb})`;
  return (
    <svg width={maxX - minX} height={maxY - minY} style={{position: 'absolute', left: minX, top: minY, overflow: 'visible'}}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-200} y={-200} width={maxX - minX + 400} height={maxY - minY + 400}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={sw * 4} pathLength={1} strokeDasharray={`${Math.min(1, draw)} 1`} />
        </mask>
      </defs>
      {ghost > 0 ? <path d={d} fill="none" stroke="rgba(150,156,163,.4)" strokeWidth={sw * 0.7} strokeDasharray={`${sw * 2.6} ${sw * 2.2}`} strokeLinecap="round" opacity={ghost} /> : null}
      {draw > 0 ? (
        <>
          <path d={d} fill="none" stroke={C} strokeWidth={sw} strokeDasharray={`${sw * 3} ${sw * 2.2}`} strokeLinecap="round" mask={`url(#${id})`}
            style={{filter: `drop-shadow(0 0 ${sw * 1.8}px rgba(${NEON.rgb},.65))`}} />
          <circle cx={l.pts[0][0] - minX} cy={l.pts[0][1] - minY} r={sw * 1.5} fill={C} />
          {draw >= 1
            ? <circle cx={l.pts[l.pts.length - 1][0] - minX} cy={l.pts[l.pts.length - 1][1] - minY} r={sw * 1.8} fill={C} />
            : <path d="M0,-16 L26,0 L0,16 Z" fill={C} transform={`translate(${tip[0] - minX},${tip[1] - minY}) rotate(${ang}) scale(${sw / 8})`} />}
        </>
      ) : null}
    </svg>
  );
};
