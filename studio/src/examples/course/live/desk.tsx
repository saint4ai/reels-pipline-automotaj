import {useId} from 'react';
import {EnvProvider} from '../../../kit/liquid/env';
import {BLUE, H, W, type Ruling} from './canvas';

// Сценарный канвас ролика 22, версия 3 (правки Александра 20.09, ночь):
// • карточки разведены по сетке змейкой — между ними большие зазоры, соседи не наезжают друг на друга;
// • связки идут по углам (вбок → над карточками → вниз в верхнюю середину следующей) и ни одну карточку не пересекают;
// • зоны стола чередуются: светлая зона под тёмной карточкой, тёмная зона под светлой — как у Пронина;
// • карточка, к которой приехала камера, загорается синим неоном, по её кромке пробегает комета.

export type Ink = 'dark' | 'light';
export type Page = {
  id: string; col: number; row: number; ruling: Ruling; label: string;
  card?: Ink;        // тон самой карточки (по умолчанию тёмная)
  zone?: Ink;        // тон зоны стола вокруг (по умолчанию противоположный карточке)
  full?: boolean;    // карточка во весь кадр (хук)
  at: number;        // секунда приезда камеры — для вспышки неона
  x?: number; y?: number;
};
export const COL = [0, 2600, 5200], ROW = [0, 3400, 6800, 10200];
export const CARD = {x: 60, y: 290, w: 1320, h: 1200};
// У каждого блока своя форма карточки: телефон — узкая вертикальная, ноутбук и дашборд — широкие, подарок — квадрат.
const SHAPE: Record<string, {x: number; y: number; w: number; h: number}> = {
  time: {x: 80, y: 300, w: 1280, h: 1220},
  fwd: {x: 60, y: 370, w: 1320, h: 1030},
  fit: {x: 300, y: 300, w: 840, h: 1200},
  ads: {x: 60, y: 330, w: 1320, h: 1060},
  nocode: {x: 60, y: 300, w: 1320, h: 1200},
  growth: {x: 120, y: 330, w: 1200, h: 1160},
  prod: {x: 60, y: 300, w: 1320, h: 1210},
  inside: {x: 60, y: 330, w: 1320, h: 1170},
  gift: {x: 160, y: 330, w: 1120, h: 1150},
  sides: {x: 60, y: 330, w: 1320, h: 1160},
  cta: {x: 180, y: 270, w: 1080, h: 1250},
};
export const cardRect = (p: Page) => (p.full ? {x: 0, y: 0, w: W, h: H} : SHAPE[p.id] ?? CARD);
const RAW: Page[] = [
  {id: 'quote', col: 0, row: 0, ruling: 'grid', label: '01 · цитата', card: 'light', zone: 'dark', full: true, at: 0},
  {id: 'time', col: 1, row: 0, ruling: 'lines', label: '02 · твоё время', at: 7.18},
  {id: 'fwd', col: 2, row: 0, ruling: 'mm', label: '03 · экспедиторы', at: 16.7},
  {id: 'fit', col: 2, row: 1, ruling: 'dots', label: '04 · тренеры', card: 'light', zone: 'dark', at: 20.1},
  {id: 'ads', col: 1, row: 1, ruling: 'big', label: '05 · аналитика', at: 24.65},
  {id: 'nocode', col: 0, row: 1, ruling: 'lines', label: '06 · без кода', card: 'light', zone: 'dark', at: 30.0},
  {id: 'growth', col: 0, row: 2, ruling: 'mm', label: '07 · рост', at: 35.9},
  {id: 'prod', col: 1, row: 2, ruling: 'grid', label: '08 · продукты агента', at: 45.1},
  {id: 'inside', col: 2, row: 2, ruling: 'dots', label: '09 · внутри обучения', at: 52.95},
  {id: 'gift', col: 2, row: 3, ruling: 'big', label: '10 · подарок', at: 57.5},
  {id: 'sides', col: 1, row: 3, ruling: 'lines', label: '11 · стороны', at: 60.55},
  {id: 'cta', col: 0, row: 3, ruling: 'grid', label: '12 · гоу', at: 63.95},
];
export const PAGES: Page[] = RAW.map((p) => ({...p, x: COL[p.col], y: ROW[p.row]}));
export const page = (id: string) => PAGES.find((p) => p.id === id)!;
export const px = (p: Page) => p.x ?? COL[p.col];
export const py = (p: Page) => p.y ?? ROW[p.row];
export const center = (p: Page) => ({cx: px(p) + W / 2, cy: py(p) + H / 2});
export const isLight = (p: Page) => (p.card ?? 'dark') === 'light';

const NOISE = 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%271.1%27 numOctaves=%273%27 stitchTiles=%27stitch%27/><feColorMatrix values=%270 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")';
// Фактура внутри карточки: у каждой своя, чтобы фоны не повторялись.
const texture = (p: Page, light: boolean): React.CSSProperties => {
  const a = light ? 'rgba(20,24,28,' : 'rgba(255,255,255,';
  const grid = (step: number, alpha: string, wpx = 2) => ({
    backgroundImage: [`linear-gradient(${a}${alpha}) ${wpx}px, transparent ${wpx}px)`, `linear-gradient(90deg, ${a}${alpha}) ${wpx}px, transparent ${wpx}px)`].join(','),
    backgroundSize: `${step}px ${step}px`,
  });
  switch (p.ruling) {
    case 'dots': return {...grid(72, '.05', 1), backgroundImage: `${grid(72, '.05', 1).backgroundImage}, radial-gradient(circle, ${a}.14) 3px, transparent 3.6px)`,
      backgroundSize: '72px 72px, 72px 72px, 72px 72px'};
    case 'lines': return grid(96, '.075');           // крупная клетка
    case 'mm': return {backgroundImage: [`linear-gradient(${a}.11) 2px, transparent 2px)`, `linear-gradient(90deg, ${a}.11) 2px, transparent 2px)`,
      `linear-gradient(${a}.045) 1px, transparent 1px)`, `linear-gradient(90deg, ${a}.045) 1px, transparent 1px)`].join(','),
      backgroundSize: '150px 150px, 150px 150px, 25px 25px, 25px 25px'};                    // миллиметровка
    case 'big': return grid(180, '.09', 3);          // редкая крупная клетка
    default: return grid(64, '.07');                 // обычная клетка
  }
};

// Кусок канваса [x0, y0, w, h] в координатах мира: зоны стола, карточки блоков. Тот же рисунок и для копий под стеклом.
export const CanvasBg: React.FC<{x0: number; y0: number; w: number; h: number; hot?: (p: Page) => number}> = ({x0, y0, w, h, hot}) => {
  const near = (p: Page, m: number) => px(p) + W + m > x0 && px(p) - m < x0 + w && py(p) + H + m > y0 && py(p) - m < y0 + h;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 30%, #16191D 0%, #0D0F12 60%, #08090B 100%)'}}>
      {/* свет вокруг карточки — строго по её месту, плиты не перекрываются */}
      {PAGES.filter((p) => near(p, 400)).map((p) => {
        const r = cardRect(p);
        return (
          <div key={`z${p.id}`} style={{position: 'absolute', left: px(p) + r.x - 260 - x0, top: py(p) + r.y - 260 - y0, width: r.w + 520, height: r.h + 520,
            background: `radial-gradient(closest-side, rgba(${BLUE.rgb},.10), rgba(${BLUE.rgb},0) 75%)`}} />
        );
      })}
      {/* сетка стола */}
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)',
        backgroundSize: '120px 120px', backgroundPosition: `${-x0}px ${-y0}px`}} />
      {PAGES.filter((p) => near(p, 200)).map((p) => {
        const r = cardRect(p), light = isLight(p), g = hot ? hot(p) : 0, R2 = p.full ? 0 : 46;
        const L = px(p) + r.x - x0, T = py(p) + r.y - y0;
        return (
          <div key={p.id} style={{position: 'absolute', left: L, top: T, width: r.w, height: r.h}}>
            {/* торец плиты — один аккуратный слой, без размытых эллипсов */}
            {!p.full ? <div style={{position: 'absolute', left: 0, top: 16, width: r.w, height: r.h, borderRadius: R2,
              background: light ? '#B7B2A7' : '#05070A', boxShadow: '0 26px 60px rgba(0,0,0,.55)'}} /> : null}
            {/* лицевая грань */}
            <div style={{position: 'absolute', inset: 0, borderRadius: R2, overflow: 'hidden',
              background: light ? 'radial-gradient(120% 90% at 30% 10%, #FFFFFF 0%, #EDEAE2 100%)' : 'radial-gradient(120% 90% at 30% 10%, #262B31 0%, #0E1114 100%)',
              boxShadow: p.full ? 'none' : `inset 0 3px 0 rgba(255,255,255,${light ? 0.95 : 0.22}), inset 0 -6px 18px rgba(0,0,0,${light ? 0.12 : 0.45}),
                inset 4px 0 14px rgba(0,0,0,${light ? 0.05 : 0.25}), inset -4px 0 14px rgba(0,0,0,${light ? 0.05 : 0.25})`}}>
              {!p.full ? <div style={{position: 'absolute', inset: 0, ...texture(p, light)}} /> : null}
              <div style={{position: 'absolute', inset: 0, background: light
                ? `radial-gradient(95% 55% at 50% -5%, rgba(255,255,255,.95), transparent 62%), radial-gradient(85% 60% at 50% 0%, rgba(${BLUE.rgb},${0.04 + 0.16 * g}), transparent 70%)`
                : `radial-gradient(95% 55% at 50% -5%, rgba(255,255,255,.08), transparent 58%), radial-gradient(85% 65% at 50% 0%, rgba(${BLUE.rgb},${0.07 + 0.3 * g}), transparent 70%)`}} />
              <div style={{position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '300px 300px', opacity: light ? 0.05 : 0.09, mixBlendMode: 'overlay'}} />
              {/* блик пробегает по грани в момент касания камеры */}
              {g > 0.02 ? <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: Math.min(1, g * 1.4),
                background: 'linear-gradient(104deg, transparent 34%, rgba(255,255,255,.45) 48%, rgba(190,220,255,.2) 54%, transparent 66%)',
                backgroundSize: '260% 100%', backgroundPosition: `${170 - g * 240}% 0`}} /> : null}
            </div>
            {/* неоновая кромка при подсветке */}
            {!p.full ? <div style={{position: 'absolute', inset: 0, borderRadius: R2, pointerEvents: 'none',
              boxShadow: `0 0 0 ${2 + 5 * g}px rgba(${BLUE.rgb},${0.18 + 0.8 * g}), 0 0 ${30 + 120 * g}px rgba(${BLUE.rgb},${0.08 + 0.55 * g})`}} /> : null}
          </div>
        );
      })}
    </div>
  );
};

// Комета по кромке карточки в момент приезда камеры.
export const CardSpark: React.FC<{p: Page; g: number}> = ({p, g}) => {
  if (g <= 0.02 || p.full) return null;
  const r = cardRect(p), per = 2 * (r.w + r.h), d = ((1 - g) * per * 1.6) % per;
  let x = 0, y = 0;
  if (d < r.w) { x = d; y = 0; } else if (d < r.w + r.h) { x = r.w; y = d - r.w; }
  else if (d < 2 * r.w + r.h) { x = r.w - (d - r.w - r.h); y = r.h; } else { x = 0; y = r.h - (d - 2 * r.w - r.h); }
  return (
    <div style={{position: 'absolute', left: px(p) + r.x + x - 26, top: py(p) + r.y + y - 26, width: 52, height: 52, borderRadius: 26, opacity: g,
      background: `radial-gradient(circle, #FFFFFF 0%, rgba(${BLUE.rgb},.9) 40%, rgba(${BLUE.rgb},0) 70%)`}} />
  );
};

export const Desk: React.FC<{cx: number; cy: number; s: number; hot?: (p: Page) => number}> = ({cx, cy, s, hot}) => {
  const w = W / s + 400, h = H / s + 400;
  const x0 = Math.floor(cx - w / 2), y0 = Math.floor(cy - h / 2);
  return <div style={{position: 'absolute', left: x0, top: y0}}><CanvasBg x0={x0} y0={y0} w={Math.ceil(w)} h={Math.ceil(h)} hot={hot} /></div>;
};

export const Block: React.FC<{p: Page; o?: number; hot?: (q: Page) => number; children?: React.ReactNode}> = ({p, o = 1, hot, children}) => {
  const r = cardRect(p);
  return (
    <div style={{position: 'absolute', left: px(p), top: py(p), width: W, height: H, opacity: o}}>
      <EnvProvider bg={() => <CanvasBg x0={px(p)} y0={py(p)} w={W} h={H} hot={hot} />}>
        {/* жёсткая обрезка по карточке: ничего не вылезает за её контейнер */}
        <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: p.full ? 0 : 44, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -r.x, top: -r.y, width: W, height: H}}>{children}</div>
        </div>
      </EnvProvider>
    </div>
  );
};
export const PageLabel: React.FC<{p: Page; o?: number}> = ({p, o = 1}) => {
  if (p.full || o <= 0) return null;
  const r = cardRect(p);
  return (
    <div style={{position: 'absolute', left: px(p) + r.x + 8, top: py(p) + r.y - 92, display: 'flex', alignItems: 'center', gap: 20, opacity: o, whiteSpace: 'nowrap',
      fontFamily: 'Manrope', fontWeight: 700, fontSize: 56, color: '#7E848A'}}>
      <span style={{width: 28, height: 28, borderRadius: 8, border: '5px solid #7E848A'}} />{p.label}
    </div>
  );
};

// ——— Связка по углам: карточка → вбок в зазор → над карточками → вниз в верхнюю середину следующей ———
export type Link = {pts: [number, number][]};
const R = 70; // радиус скругления углов
export const linkOf = (from: Page, to: Page): Link => {
  const ra = cardRect(from), rb = cardRect(to);
  const ax = px(from) + ra.x, ay = py(from) + ra.y, bx = px(to) + rb.x, by = py(to) + rb.y;
  const bTop: [number, number] = [bx + rb.w / 2, by];
  if (to.row === from.row) {
    // соседи в ряду: выход из боковой кромки, подъём над карточками, вход сверху
    const right = px(to) > px(from);
    const side: [number, number] = [right ? ax + ra.w : ax, ay + ra.h * 0.5];
    const gap = right ? (bx + ax + ra.w) / 2 : (ax + bx + rb.w) / 2;
    const bus = Math.min(ay, by) - 260;
    return {pts: [side, [gap, side[1]], [gap, bus], [bTop[0], bus], bTop]};
  }
  // переход в следующий ряд: выход снизу, спуск в зазоре, вход сверху
  const bottom: [number, number] = [ax + ra.w / 2, ay + ra.h];
  const mid = (bottom[1] + by) / 2;
  return {pts: [bottom, [bottom[0], mid], [bTop[0], mid], bTop]};
};
const lens = (pts: [number, number][]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
export const linkPoint = (l: Link, u: number): [number, number] => {
  const L = lens(l.pts), total = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * total;
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
    const r = Math.min(R, va / 2, vb / 2);
    const s1: [number, number] = [p[0] + ((a[0] - p[0]) / va) * r, p[1] + ((a[1] - p[1]) / va) * r];
    const s2: [number, number] = [p[0] + ((b[0] - p[0]) / vb) * r, p[1] + ((b[1] - p[1]) / vb) * r];
    d += ` L${s1[0]},${s1[1]} Q${p[0]},${p[1]} ${s2[0]},${s2[1]}`;
  }
  const e = pts[pts.length - 1];
  return `${d} L${e[0]},${e[1]}`;
};
export const Connector: React.FC<{l: Link; draw: number; ghost?: number; sw?: number}> = ({l, draw, ghost = 0, sw = 8}) => {
  const id = 'cn' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const xs = l.pts.map((p) => p[0]), ys = l.pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 120, minY = Math.min(...ys) - 120, maxX = Math.max(...xs) + 120, maxY = Math.max(...ys) + 120;
  const d = pathOf(l.pts.map((p) => [p[0] - minX, p[1] - minY]) as [number, number][]);
  const p = Math.min(1, Math.max(0.001, draw));
  const tip = linkPoint(l, p), pre = linkPoint(l, Math.max(0, p - 0.015));
  const ang = (Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) * 180) / Math.PI;
  if (draw <= 0 && ghost <= 0) return null;
  const C = `rgb(${BLUE.rgb})`;
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
            style={{filter: `drop-shadow(0 0 ${sw * 1.8}px rgba(${BLUE.rgb},.65))`}} />
          <circle cx={l.pts[0][0] - minX} cy={l.pts[0][1] - minY} r={sw * 1.5} fill={C} />
          {draw >= 1
            ? <circle cx={l.pts[l.pts.length - 1][0] - minX} cy={l.pts[l.pts.length - 1][1] - minY} r={sw * 1.8} fill={C} style={{filter: `drop-shadow(0 0 ${sw * 2}px rgba(${BLUE.rgb},.9))`}} />
            : <path d="M0,-16 L26,0 L0,16 Z" fill={C} transform={`translate(${tip[0] - minX},${tip[1] - minY}) rotate(${ang}) scale(${sw / 8})`} />}
        </>
      ) : null}
    </svg>
  );
};
