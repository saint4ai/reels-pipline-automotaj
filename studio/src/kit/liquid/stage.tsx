import {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../../theme';
import {useEnv} from './env';

// Фоны ролика 21 «монтаж» (пять стилистик, DIRECTION.md). Всё — чистые функции времени t (секунды), без случайности:
// одна и та же секунда рисуется одинаково в отдельном кадре и в рендере. Стекло (LiquidPanel) повторяет эти фоны внутри себя.

// Детерминированная последовательность 0…1.
export const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Шум плёнки поверх фона (SVG feTurbulence, статичный узор).
export const Grain: React.FC<{o?: number}> = ({o = 0.07}) => (
  <AbsoluteFill style={{opacity: o, mixBlendMode: 'overlay', pointerEvents: 'none',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27260%27 height=%27260%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")'}} />
);

// ——— S1 «Ночная сцена»: прожекторы, пыль в лучах, луна, стеклянные сферы ———

// Прожектор: конус из точки (x, y), угол от вертикали вниз в градусах (плюс — вправо), раскрытие spread, длина len.
export type Spot = {x: number; y: number; angle: number; spread?: number; len?: number; color?: string; power?: number};
const beamPoly = (s: Spot) => {
  const spread = s.spread ?? 16, len = s.len ?? 3000;
  const a = (s.angle * Math.PI) / 180, h = (spread * Math.PI) / 180;
  const p = (ang: number) => [s.x + Math.sin(ang) * len, s.y + Math.cos(ang) * len];
  return {apex: [s.x, s.y], l: p(a - h), r: p(a + h), end: p(a)};
};

export const Beam: React.FC<{s: Spot}> = ({s}) => {
  const id = 'b' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const {apex, l, r, end} = beamPoly(s);
  const c = s.color ?? '255,247,236', k = s.power ?? 1;
  const core = beamPoly({...s, spread: (s.spread ?? 16) * 0.38});
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={apex[0]} y1={apex[1]} x2={end[0]} y2={end[1]}>
          <stop offset="0" stopColor={`rgb(${c})`} stopOpacity={0.55 * k} />
          <stop offset="0.45" stopColor={`rgb(${c})`} stopOpacity={0.2 * k} />
          <stop offset="1" stopColor={`rgb(${c})`} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={22} /></filter>
        <filter id={`${id}c`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9} /></filter>
      </defs>
      <polygon points={`${apex} ${l} ${r}`} fill={`url(#${id}g)`} filter={`url(#${id}f)`} />
      <polygon points={`${core.apex} ${core.l} ${core.r}`} fill={`url(#${id}g)`} opacity={0.8} filter={`url(#${id}c)`} />
      <circle cx={apex[0]} cy={apex[1]} r={26} fill={`rgb(${c})`} opacity={0.9 * k} filter={`url(#${id}c)`} />
    </svg>
  );
};

// Световое пятно на полу там, куда смотрит луч.
export const Pool: React.FC<{x: number; y: number; w: number; color?: string; o?: number}> = ({x, y, w, color = '255,244,230', o = 0.5}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.16, width: w, height: w * 0.32, borderRadius: '50%', mixBlendMode: 'screen',
    background: `radial-gradient(closest-side, rgba(${color},${o}) 0%, rgba(${color},${o * 0.35}) 55%, rgba(${color},0) 100%)`}} />
);

// Пыль: частицы дрейфуют вверх; в луче вспыхивают, вне луча почти не видны.
export const Dust: React.FC<{t: number; n?: number; spots: Spot[]; seed?: number}> = ({t, n = 110, spots, seed = 11}) => {
  const r = rnd(seed);
  const parts = Array.from({length: n}, () => ({x: r() * W, y: r() * H, s: 2 + r() * 4, v: 14 + r() * 26, ph: r() * 6.28}));
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {parts.map((p, i) => {
        const y = ((p.y - p.v * t) % H + H) % H, x = p.x + Math.sin(t * 0.7 + p.ph) * 18;
        let lit = 0;
        for (const s of spots) {
          const ang = (Math.atan2(x - s.x, y - s.y) * 180) / Math.PI;
          const d = Math.abs(ang - s.angle), sp = s.spread ?? 16;
          if (y > s.y) lit = Math.max(lit, cl(1 - d / sp) * (s.power ?? 1));
        }
        const o = 0.06 + lit * 0.85 * (0.6 + 0.4 * Math.sin(t * 3 + p.ph));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: p.s, height: p.s, borderRadius: '50%', background: '#FFF7EC', opacity: o,
          boxShadow: lit > 0.3 ? '0 0 8px rgba(255,247,236,.8)' : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

// Луна (правки Александра 19.09.2026: крупнее, «грамотные» кратеры, видно сияние, от неё идёт луч).
// Вектор SVG: фактура поверхности (фрактальный шум), тёмные моря, кратеры со светлым валом и тенью внутри
// (свет слева сверху), центральные горки у крупных, лучевая система у одного, затемнение к краю и терминатор.
// Сияние — два ореола; лунный луч (beam) — конус холодного света из диска, рисуется под диском.
type Crater = {x: number; y: number; r: number; peak?: boolean; rays?: boolean};
const rm = rnd(77);
const CRATERS: Crater[] = [
  {x: -0.3, y: 0.42, r: 0.16, peak: true, rays: true}, {x: 0.34, y: -0.3, r: 0.2, peak: true}, {x: -0.46, y: -0.28, r: 0.13},
  {x: 0.12, y: 0.18, r: 0.11}, {x: 0.55, y: 0.25, r: 0.1}, {x: -0.08, y: -0.58, r: 0.09}, {x: 0.2, y: 0.62, r: 0.08},
  // мелочь — россыпь мелких кратеров
  ...Array.from({length: 38}, () => {
    const a = rm() * Math.PI * 2, d = Math.sqrt(rm()) * 0.88;
    return {x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.018 + rm() * 0.04};
  }),
];
const MARIA = [{x: -0.18, y: -0.12, rx: 0.34, ry: 0.24, rot: -18}, {x: 0.32, y: 0.24, rx: 0.26, ry: 0.19, rot: 25}, {x: -0.02, y: 0.36, rx: 0.2, ry: 0.13, rot: 5}, {x: -0.5, y: 0.1, rx: 0.14, ry: 0.22, rot: 0}];
export type MoonProps = {x: number; y: number; r: number; o?: number; beam?: {angle: number; spread?: number; power?: number; len?: number}};
export const Moon: React.FC<MoonProps> = ({x, y, r, o = 1, beam}) => {
  const id = 'm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const D = r * 2;
  return (
    <>
      {beam ? <Beam s={{x, y, angle: beam.angle, spread: beam.spread ?? 10, power: (beam.power ?? 0.85) * o, len: beam.len ?? 2600, color: '214,255,245'}} /> : null}
      {/* сияние: широкий мягкий ореол и плотное свечение у края диска */}
      <div style={{position: 'absolute', left: x - r * 6, top: y - r * 6, width: r * 12, height: r * 12, borderRadius: '50%', opacity: o * 0.7, mixBlendMode: 'screen',
        background: 'radial-gradient(closest-side, rgba(200,255,238,.42) 0%, rgba(170,245,225,.16) 30%, rgba(160,240,220,.05) 60%, rgba(160,240,220,0) 100%)'}} />
      <div style={{position: 'absolute', left: x - r * 1.9, top: y - r * 1.9, width: r * 3.8, height: r * 3.8, borderRadius: '50%', opacity: o, mixBlendMode: 'screen',
        background: 'radial-gradient(closest-side, rgba(235,255,249,.85) 45%, rgba(190,255,236,.35) 62%, rgba(160,245,222,0) 100%)'}} />
      <svg width={D} height={D} viewBox={`${-r} ${-r} ${D} ${D}`} style={{position: 'absolute', left: x - r, top: y - r, opacity: o, overflow: 'visible'}}>
        <defs>
          <clipPath id={`${id}c`}><circle r={r} /></clipPath>
          <radialGradient id={`${id}b`} cx="0.4" cy="0.36" r="0.72">
            <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#F2FFFA" /><stop offset="0.7" stopColor="#D5F0E7" /><stop offset="1" stopColor="#A9D8CA" />
          </radialGradient>
          <radialGradient id={`${id}f`} cx="0.64" cy="0.66" r="0.62">
            <stop offset="0" stopColor="#F4FFFB" /><stop offset="0.5" stopColor="#CDEBE2" /><stop offset="1" stopColor="#8FBFB2" />
          </radialGradient>
          <radialGradient id={`${id}l`} cx="0.42" cy="0.4" r="0.62">
            <stop offset="0.62" stopColor="#0B2A24" stopOpacity="0" /><stop offset="1" stopColor="#0B2A24" stopOpacity="0.42" />
          </radialGradient>
          <filter id={`${id}t`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={0.9 / Math.max(40, r * 0.25)} numOctaves={4} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.38  0 0 0 0 0.34  0 0 0 -2.2 1.35" />
          </filter>
          <filter id={`${id}s`}><feGaussianBlur stdDeviation={r * 0.035} /></filter>
          <filter id={`${id}k`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={r * 0.006} /></filter>
          {/* внутренняя стенка, обращённая к свету, — светлая справа снизу */}
          <linearGradient id={`${id}in`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>
          {/* внешний склон вала: освещён слева сверху, в тени справа снизу */}
          <linearGradient id={`${id}out`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" /><stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.6" stopColor="#4F7C71" stopOpacity="0" /><stop offset="1" stopColor="#4F7C71" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}c)`}>
          <circle r={r} fill={`url(#${id}b)`} />
          <rect x={-r} y={-r} width={D} height={D} filter={`url(#${id}t)`} opacity={0.32} />
          {MARIA.map((m, i) => (
            <ellipse key={i} cx={m.x * r} cy={m.y * r} rx={m.rx * r} ry={m.ry * r} transform={`rotate(${m.rot} ${m.x * r} ${m.y * r})`}
              fill="#7FAEA2" opacity={0.32} filter={`url(#${id}s)`} />
          ))}
          {CRATERS.filter((c) => c.rays).map((c, i) => (
            <g key={`r${i}`} opacity={0.42} filter={`url(#${id}s)`}>
              {Array.from({length: 14}, (_, q) => {
                const a = (q / 14) * Math.PI * 2 + (q % 3) * 0.2, len = r * (0.35 + ((q * 37) % 10) / 16);
                return <line key={q} x1={c.x * r} y1={c.y * r} x2={c.x * r + Math.cos(a) * len} y2={c.y * r + Math.sin(a) * len} stroke="#FFFFFF" strokeWidth={r * 0.018} strokeLinecap="round" />;
              })}
            </g>
          ))}
          {CRATERS.map((c, i) => {
            const cx = c.x * r, cy = c.y * r, cr = c.r * r;
            return (
              <g key={i} filter={`url(#${id}k)`}>
                <clipPath id={`${id}q${i}`}><circle cx={cx} cy={cy} r={cr} /></clipPath>
                {/* вал снаружи */}
                <circle cx={cx} cy={cy} r={cr * 1.07} fill="none" stroke={`url(#${id}out)`} strokeWidth={cr * 0.16} />
                {/* чаша: тёмный серп у стенки со стороны света, дно в тон поверхности, светлая дальняя стенка */}
                <g clipPath={`url(#${id}q${i})`}>
                  <circle cx={cx} cy={cy} r={cr} fill="#6F978D" opacity={0.55} />
                  <circle cx={cx + cr * 0.3} cy={cy + cr * 0.3} r={cr * 0.98} fill="#D9F0E9" opacity={0.92} />
                  <circle cx={cx} cy={cy} r={cr * 0.94} fill="none" stroke={`url(#${id}in)`} strokeWidth={cr * 0.16} />
                </g>
                {c.peak ? <><ellipse cx={cx + cr * 0.06} cy={cy + cr * 0.08} rx={cr * 0.16} ry={cr * 0.1} fill="#5F8A7F" opacity={0.45} /><circle cx={cx - cr * 0.02} cy={cy - cr * 0.02} r={cr * 0.1} fill="#FFFFFF" opacity={0.9} /></> : null}
              </g>
            );
          })}
          <circle r={r} fill={`url(#${id}l)`} />
        </g>
      </svg>
    </>
  );
};

// Стеклянная сфера: внутри — перевёрнутая и уменьшенная копия фона (как настоящий шар-линза), по краю — френель и блик.
export const GlassSphere: React.FC<{x: number; y: number; d: number; k?: number}> = ({x, y, d, k = 0.55}) => {
  const env = useEnv();
  const cx = x + d / 2, cy = y + d / 2;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: d, height: d, borderRadius: '50%', overflow: 'hidden',
      boxShadow: '0 30px 60px rgba(0,0,0,.45), 0 8px 18px rgba(0,0,0,.35)'}}>
      {env ? (
        <div style={{position: 'absolute', left: -x, top: -y, width: env.w, height: env.h, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${-k})`, filter: 'saturate(1.3) contrast(1.05)'}}>
          {env.render()}
        </div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 55%, rgba(210,255,244,.18) 78%, rgba(255,255,255,.55) 97%, rgba(255,255,255,.2) 100%)'}} />
      <div style={{position: 'absolute', left: d * 0.2, top: d * 0.12, width: d * 0.34, height: d * 0.2, borderRadius: '50%', transform: 'rotate(-28deg)',
        background: 'radial-gradient(closest-side, rgba(255,255,255,.85), rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset ${-d * 0.04}px ${-d * 0.05}px ${d * 0.1}px rgba(0,0,0,.35), inset ${d * 0.02}px ${d * 0.02}px ${d * 0.04}px rgba(255,255,255,.35)`}} />
    </div>
  );
};

// Сам фон ночной сцены (без сфер — сферы кладутся сверху, они повторяют этот фон).
export const NightStage: React.FC<{t: number; spots?: Spot[]; moon?: MoonProps; dust?: number; floor?: number; glow?: string; pools?: boolean}> =
  ({t, spots = [], moon, dust = 90, floor = 2050, glow = '61,237,195', pools = true}) => (
    <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 30%, #121417 0%, #0A0B0D 55%, #050506 100%)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -200, top: floor - 380, width: W + 400, height: 900,
        background: `radial-gradient(60% 40% at 50% 50%, rgba(${glow},.10) 0%, rgba(${glow},0) 70%)`}} />
      <div style={{position: 'absolute', left: 0, top: floor, width: W, height: H - floor,
        background: 'linear-gradient(180deg, rgba(255,255,255,.035) 0%, rgba(255,255,255,0) 60%)', borderTop: '2px solid rgba(255,255,255,.05)'}} />
      {moon ? <Moon {...moon} /> : null}
      {spots.map((s, i) => <Beam key={i} s={s} />)}
      {pools ? spots.map((s, i) => {
        const a = (s.angle * Math.PI) / 180, dy = floor - s.y;
        const px = s.x + Math.tan(a) * dy;
        return <Pool key={i} x={px} y={floor} w={dy * Math.tan(((s.spread ?? 16) * Math.PI) / 180) * 2.4} o={0.4 * (s.power ?? 1)} />;
      }) : null}
      {dust ? <Dust t={t} spots={moon?.beam ? [...spots, {x: moon.x, y: moon.y, angle: moon.beam.angle, spread: moon.beam.spread ?? 10, power: 0.9}] : spots} n={dust} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.5) 100%)'}} />
      <Grain />
    </AbsoluteFill>
  );

// ——— S2 «Небо на рассвете»: слои облаков с параллаксом; rise 0…1 — камера поднимается над облаками ———
type Puff = {x: number; y: number; w: number; h: number; o: number};
const cloudLayer = (seed: number, n: number, y0: number, y1: number, size: number): Puff[] => {
  const r = rnd(seed);
  return Array.from({length: n}, () => ({x: r() * 1.4 - 0.2, y: y0 + r() * (y1 - y0), w: size * (0.7 + r() * 0.8), h: size * (0.22 + r() * 0.16), o: 0.55 + r() * 0.4}));
};
const LAYERS = [
  {puffs: cloudLayer(3, 14, 0.1, 0.9, 900), speed: 0.35, blur: 26, tint: '255,226,200'},
  {puffs: cloudLayer(7, 12, 0.0, 1.0, 1100), speed: 0.7, blur: 18, tint: '255,238,222'},
  {puffs: cloudLayer(13, 9, -0.1, 1.1, 1400), speed: 1.2, blur: 12, tint: '255,248,240'},
];
const rs = rnd(41);
const STARS = Array.from({length: 70}, () => ({x: rs(), y: rs(), s: 2 + rs() * 5, ph: rs() * 6.28}));
export const DawnSky: React.FC<{t: number; rise?: number}> = ({t, rise = 0}) => {
  const horizon = 0.62 * H + rise * 900;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: `linear-gradient(180deg, #140A05 0px, #4A1C0A ${horizon * 0.35}px, #C9501C ${horizon * 0.72}px, #FF9A55 ${horizon}px, #FFD2AE ${horizon + 260}px, #FFE9D8 ${horizon + 700}px)`}}>
      <div style={{position: 'absolute', left: W * 0.62 - 700, top: horizon - 700, width: 1400, height: 1400, borderRadius: '50%', mixBlendMode: 'screen',
        background: 'radial-gradient(closest-side, rgba(255,250,235,.95) 0%, rgba(255,200,140,.55) 18%, rgba(255,140,70,.18) 45%, rgba(255,120,50,0) 100%)'}} />
      <div style={{position: 'absolute', left: W * 0.62 - 90, top: horizon - 90, width: 180, height: 180, borderRadius: '50%', background: '#FFF8EC', boxShadow: '0 0 80px rgba(255,236,210,.9)'}} />
      {/* над облаками — звёзды в тёмной части неба */}
      {rise > 0 ? STARS.map((st, i) => (
        <div key={`s${i}`} style={{position: 'absolute', left: st.x * W, top: st.y * horizon * 0.8, width: st.s, height: st.s, borderRadius: '50%', background: '#FFF6EA',
          opacity: rise * (0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + st.ph))), boxShadow: st.s > 4 ? '0 0 10px rgba(255,246,234,.9)' : undefined}} />
      )) : null}
      {LAYERS.map((L, li) => (
        <AbsoluteFill key={li}>
          {L.puffs.map((p, i) => {
            const x = ((p.x * W + t * 22 * L.speed) % (W * 1.4)) - W * 0.2;
            const y = p.y * H + rise * 1500 * L.speed;
            return <div key={i} style={{position: 'absolute', left: x - p.w / 2, top: y - p.h / 2, width: p.w, height: p.h, borderRadius: '50%',
              background: `radial-gradient(closest-side, rgba(${L.tint},${p.o}) 0%, rgba(${L.tint},${p.o * 0.55}) 50%, rgba(${L.tint},0) 100%)`, filter: `blur(${L.blur}px)`}} />;
          })}
        </AbsoluteFill>
      ))}
      <Grain o={0.05} />
    </AbsoluteFill>
  );
};

// ——— S3 «Рифлёное стекло»: вертикальные рёбра над текущим градиентом оранжевый ↔ мятный ———
type Blob = {x: number; y: number; r: number; c: string};
const blobsAt = (t: number, mix: number): Blob[] => [
  {x: 0.3 + 0.12 * Math.sin(t * 0.5), y: 0.28 + 0.08 * Math.cos(t * 0.4), r: 0.55, c: `rgba(255,122,47,${0.95 - mix * 0.5})`},
  {x: 0.72 + 0.1 * Math.cos(t * 0.45), y: 0.5 + 0.1 * Math.sin(t * 0.35), r: 0.5, c: `rgba(61,237,195,${0.45 + mix * 0.5})`},
  {x: 0.45 + 0.15 * Math.sin(t * 0.3 + 2), y: 0.78 + 0.06 * Math.sin(t * 0.6), r: 0.45, c: 'rgba(255,240,228,.35)'},
  {x: 0.1 + 0.08 * Math.cos(t * 0.5 + 1), y: 0.62, r: 0.4, c: `rgba(255,122,47,${0.5 - mix * 0.3})`},
];
const BlobField: React.FC<{t: number; mix: number}> = ({t, mix}) => (
  <AbsoluteFill style={{background: '#0E0F12'}}>
    {blobsAt(t, mix).map((b, i) => (
      <div key={i} style={{position: 'absolute', left: b.x * W - b.r * W, top: b.y * H - b.r * W, width: b.r * W * 2, height: b.r * W * 2, borderRadius: '50%',
        background: `radial-gradient(closest-side, ${b.c} 0%, ${b.c.replace(/[\d.]+\)$/, '0)')} 100%)`}} />
    ))}
  </AbsoluteFill>
);
export const Reeded: React.FC<{t: number; mix?: number; rib?: number}> = ({t, mix = 0, rib = 60}) => {
  const n = Math.ceil(W / rib);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#0E0F12'}}>
      {Array.from({length: n}, (_, i) => {
        const x0 = i * rib, c = x0 + rib / 2;
        return (
          <div key={i} style={{position: 'absolute', left: x0, top: 0, width: rib, height: H, overflow: 'hidden'}}>
            {/* каждое ребро — цилиндрическая линза: показывает сжатый и сдвинутый кусок градиента */}
            <div style={{position: 'absolute', left: -x0, top: 0, width: W, height: H, transformOrigin: `${c}px 50%`, transform: `scaleX(${-0.42})`}}>
              <BlobField t={t} mix={mix} />
            </div>
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.34) 0%, rgba(255,255,255,.07) 30%, rgba(255,255,255,.16) 46%, rgba(0,0,0,.05) 70%, rgba(0,0,0,.4) 100%)'}} />
          </div>
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 50%, rgba(0,0,0,.45) 100%)'}} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

// ——— S5 «Платиновая студия»: светлое стекло, мягкие каустики, тёплый белый ———
export const Platinum: React.FC<{t: number; warm?: number}> = ({t, warm = 1}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 30%, #FFFFFF 0%, #F3F4F2 50%, #E2E5E2 100%)'}}>
    {[
      {x: 0.2 + 0.05 * Math.sin(t * 0.4), y: 0.22, r: 520, c: `rgba(255,190,150,${0.35 * warm})`},
      {x: 0.8 + 0.04 * Math.cos(t * 0.35), y: 0.4, r: 600, c: 'rgba(61,237,195,.22)'},
      {x: 0.5, y: 0.75 + 0.03 * Math.sin(t * 0.5), r: 700, c: 'rgba(255,255,255,.8)'},
    ].map((b, i) => (
      <div key={i} style={{position: 'absolute', left: b.x * W - b.r, top: b.y * H - b.r, width: b.r * 2, height: b.r * 2, borderRadius: '50%',
        background: `radial-gradient(closest-side, ${b.c}, rgba(255,255,255,0))`}} />
    ))}
    {/* каустики — косые полосы света, медленно плывут */}
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: -400 + i * 520 + ((t * 30) % 520), top: -200, width: 140, height: H + 400, transform: 'rotate(18deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))', opacity: 0.5}} />
    ))}
    <Grain o={0.04} />
  </AbsoluteFill>
);
