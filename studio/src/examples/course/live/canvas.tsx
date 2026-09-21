import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Mark} from '../../montage/parts';

// «Живая сборка» (ролик 22): весь ролик — один графитовый канвас-стол, на нём тетрадные листы смысловых блоков (desk.tsx);
// камера едет от листа к листу по пунктирной связке, которую тянет ИИ-агент (мятный курсор с меткой Claude).
// Правки Александра 20.09: фон — графит с шумом и сеткой как в тетради; оранжевый и мята только акцентами; монтаж — сценарный канвас.

export const W = 1440, H = 2560;
export const MINT = '#3DEDC3', MINT_INK = '#05231D', ORANGE = '#FF7A2F', INK = '#F2F1EE', DIM = '#9DA2A8';
// Неон карточек — синий в тон голубой подсветке в записи Александра (правка 20.09). Красный — тревожная сторона «руками».
export const BLUE = {hex: '#3AA6FF', rgb: '58,166,255'};
export const RED = {hex: '#FF4D4D', rgb: '255,77,77'};
export const DARK_INK = '#15181B';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
// Перелёт камеры с ударом: быстрый рывок и мягкое гашение с лёгким перелётом (правка «вялое движение», 20.09).
const punch = Easing.bezier(0.16, 0.9, 0.22, 1);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ——— Камера: ключи [секунда, cx, cy, масштаб]; между ключами — плавный переход, масштаб — в логарифме (зум без рывка) ———
export type Cam = {cx: number; cy: number; s: number};
export type CamKey = [number, number, number, number];
export const camAt = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0][0]) return {cx: keys[0][1], cy: keys[0][2], s: keys[0][3]};
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0, s0] = keys[i], [t1, x1, y1, s1] = keys[i + 1];
    if (t < t1) {
      if (t0 === t1) continue;
      const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      const p = punch(u);
      return {cx: lerp(x0, x1, p), cy: lerp(y0, y1, p), s: Math.exp(lerp(Math.log(s0), Math.log(s1), p))};
    }
  }
  const l = keys[keys.length - 1];
  return {cx: l[1], cy: l[2], s: l[3]};
};
export const toScreen = (c: Cam, x: number, y: number) => ({x: (x - c.cx) * c.s + W / 2, y: (y - c.cy) * c.s + H / 2});
export const worldStyle = (c: Cam): React.CSSProperties => ({position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0',
  transform: `translate(${W / 2 - c.cx * c.s}px, ${H / 2 - c.cy * c.s}px) scale(${c.s})`});

// ——— Шум: SVG feTurbulence, мелкое зерно поверх графита ———
const NOISE = 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%271.1%27 numOctaves=%273%27 stitchTiles=%27stitch%27/><feColorMatrix values=%270 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")';
export const Noise: React.FC<{o?: number}> = ({o = 0.09}) => (
  <AbsoluteFill style={{backgroundImage: NOISE, backgroundSize: '300px 300px', opacity: o, mixBlendMode: 'overlay', pointerEvents: 'none'}} />
);

// ——— Разлиновка «как в тетради» ———
export type Ruling = 'grid' | 'lines' | 'mm' | 'dots' | 'big';
const line = (c: string, w: number) => `linear-gradient(${c} ${w}px, transparent ${w}px)`;
const vline = (c: string, w: number) => `linear-gradient(90deg, ${c} ${w}px, transparent ${w}px)`;
export const rulingStyle = (r: Ruling, k = 1, dark = false): React.CSSProperties => {
  const a = (v: number) => (dark ? `rgba(20,24,28,${(v * k).toFixed(3)})` : `rgba(255,255,255,${(v * k).toFixed(3)})`);
  switch (r) {
    case 'grid': return {backgroundImage: [line(a(0.075), 2), vline(a(0.075), 2)].join(','), backgroundSize: '64px 64px'};
    case 'lines': return {backgroundImage: line(a(0.09), 2), backgroundSize: '100% 84px'};
    case 'mm': return {backgroundImage: [line(a(0.1), 2), vline(a(0.1), 2), line(a(0.04), 1), vline(a(0.04), 1)].join(','), backgroundSize: '160px 160px, 160px 160px, 16px 16px, 16px 16px'};
    case 'dots': return {backgroundImage: `radial-gradient(circle, ${a(0.16)} 2.4px, transparent 3px)`, backgroundSize: '56px 56px'};
    case 'big': return {backgroundImage: [line(a(0.08), 3), vline(a(0.08), 3)].join(','), backgroundSize: '180px 180px'};
  }
};

// ——— Путь курсора: точки [секунда, x, y]; между ними — плавный переход с лёгкой дугой ———
export type Pt = [number, number, number];
export const track = (t: number, pts: Pt[]) => {
  if (t <= pts[0][0]) return {x: pts[0][1], y: pts[0][2]};
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, x0, y0] = pts[i], [t1, x1, y1] = pts[i + 1];
    if (t < t1) {
      const p = inOut((t - t0) / Math.max(0.001, t1 - t0));
      const dx = x1 - x0, dy = y1 - y0, arc = Math.sin(Math.PI * p) * 0.1;
      return {x: x0 + dx * p - dy * arc, y: y0 + dy * p + dx * arc};
    }
  }
  const l = pts[pts.length - 1];
  return {x: l[1], y: l[2]};
};
// Нажатие: 0…1 вокруг каждой секунды щелчка.
export const pressAt = (t: number, clicks: number[]) => clicks.reduce((m, c) => Math.max(m, interpolate(t, [c - 0.06, c, c + 0.12], [0, 1, 0], cl)), 0);

// Курсор агента: мятная стрелка с тёмной обводкой и меткой «Claude»; кольцо щелчка. x, y — остриё, в координатах кадра.
export const AgentCursor: React.FC<{x: number; y: number; press?: number; ripple?: number[]; t?: number; o?: number; tag?: boolean; plain?: boolean}> =
  ({x, y, press = 0, ripple = [], t = 0, o = 1, tag = true, plain = false}) => {
    if (o <= 0) return null;
    const s = 1 - 0.14 * press;
    return (
      <div style={{position: 'absolute', left: x, top: y, opacity: o, pointerEvents: 'none'}}>
        {ripple.map((c, i) => {
          const r = interpolate(t, [c, c + 0.45], [0, 1], cl);
          return r > 0 && r < 1 ? <div key={i} style={{position: 'absolute', left: -70 * r, top: -70 * r, width: 140 * r, height: 140 * r, borderRadius: '50%',
            border: `${5 * (1 - r) + 1}px solid ${plain ? '#FFFFFF' : MINT}`, opacity: 1 - r}} /> : null;
        })}
        <svg width={72} height={98} viewBox="0 0 52 70" style={{position: 'absolute', left: -4, top: -3, transformOrigin: '4px 3px', transform: `scale(${s})`,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))', overflow: 'visible'}}>
          <path d="M3 2 L3 54 L15 43 L24 64 L34 60 L25 40 L42 40 Z" fill={plain ? '#FFFFFF' : MINT} stroke={plain ? '#16181B' : MINT_INK} strokeWidth={3.2} strokeLinejoin="round" />
        </svg>
        {tag && !plain ? (
          // у правого края кадра метка разворачивается влево, иначе уезжает за границу
          <div style={{position: 'absolute', left: x > 1120 ? -14 : 52, top: 78, transform: x > 1120 ? 'translateX(-100%)' : undefined,
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px 10px 12px', borderRadius: 999,
            background: MINT, boxShadow: '0 8px 20px rgba(0,0,0,.35)', whiteSpace: 'nowrap'}}>
            <span style={{width: 44, height: 44, borderRadius: 22, background: '#FFFFFF', display: 'grid', placeItems: 'center'}}><Mark name="claude" size={30} /></span>
            <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, color: MINT_INK}}>Claude</span>
          </div>
        ) : null}
      </div>
    );
  };

// Рамка выделения: мятный контур, 8 ручек, подпись размера снизу. Координаты артборда.
export const Selection: React.FC<{x: number; y: number; w: number; h: number; o?: number; size?: boolean; color?: string}> = ({x, y, w, h, o = 1, size = true, color = MINT}) => {
  if (o <= 0) return null;
  const hs = 22;
  const handles = [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, border: `4px solid ${color}`}} />
      {handles.map(([u, v], i) => (
        <div key={i} style={{position: 'absolute', left: u * w - hs / 2, top: v * h - hs / 2, width: hs, height: hs, background: '#FFFFFF', border: `4px solid ${color}`, boxSizing: 'border-box'}} />
      ))}
      {size ? (
        <div style={{position: 'absolute', left: '50%', top: h + 26, transform: 'translateX(-50%)', padding: '6px 16px', borderRadius: 10, background: color,
          fontFamily: 'JBM', fontWeight: 700, fontSize: 30, color: MINT_INK, whiteSpace: 'nowrap'}}>{Math.round(w)} × {Math.round(h)}</div>
      ) : null}
    </div>
  );
};

// Клавиша, нажатая агентом (⌫, ⏎): короткая пилюля у курсора.
export const Key: React.FC<{x: number; y: number; label: string; t: number; at: number}> = ({x, y, label, t, at}) => {
  const a = interpolate(t, [at - 0.05, at + 0.08, at + 0.5, at + 0.7], [0, 1, 1, 0], cl);
  if (a <= 0) return null;
  const p = interpolate(t, [at, at + 0.1, at + 0.2], [0, 1, 0], cl);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: a, transform: `translateY(${(1 - a) * 12 + p * 6}px)`, minWidth: 96, height: 96, padding: '0 20px',
      boxSizing: 'border-box', borderRadius: 22, background: 'linear-gradient(180deg, #3A3D42, #26282C)', display: 'grid', placeItems: 'center',
      boxShadow: `0 ${8 - p * 6}px 0 #111214, 0 16px 30px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.18)`, fontFamily: 'Manrope', fontWeight: 800, fontSize: 52, color: INK}}>{label}</div>
  );
};
