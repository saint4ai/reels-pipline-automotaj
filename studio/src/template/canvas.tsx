import {createContext, useContext} from 'react';
import {Easing, interpolate} from 'remotion';
import {Mark} from '../montage/parts';
import {FORMATS, type Format} from '../formats';

// Камера по холсту, курсор ИИ-агента и общие цвета шаблона. Размер кадра берётся из формата (рилс или YouTube).
export const MINT = '#3DEDC3', MINT_INK = '#05231D', ORANGE = '#FF7A2F', INK = '#F2F1EE', DIM = '#9DA2A8', DARK = '#15181B';
// Неон подсветки активной карточки (утверждён в ролике 22). Хочешь мятный — поменяй здесь.
export const NEON = {hex: '#3AA6FF', rgb: '58,166,255'};
export const RED = {hex: '#FF4D4D', rgb: '255,77,77'};

const FormatCtx = createContext<Format>(FORMATS.reels);
export const FormatProvider = FormatCtx.Provider;
export const useFormat = () => useContext(FormatCtx);

export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
// Резкий старт и мягкая посадка — переезд камеры читается как рывок, а не как дрейф.
const punch = Easing.bezier(0.16, 0.9, 0.22, 1);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export type Cam = {cx: number; cy: number; s: number};
// Ключ камеры: [секунда, центр x, центр y, масштаб]. Ключи строго по возрастанию времени.
export type CamKey = [number, number, number, number];
export const camAt = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0][0]) return {cx: keys[0][1], cy: keys[0][2], s: keys[0][3]};
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0, s0] = keys[i], [t1, x1, y1, s1] = keys[i + 1];
    if (t < t1) {
      if (t0 === t1) continue;
      const p = punch(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
      return {cx: lerp(x0, x1, p), cy: lerp(y0, y1, p), s: Math.exp(lerp(Math.log(s0), Math.log(s1), p))};
    }
  }
  const l = keys[keys.length - 1];
  return {cx: l[1], cy: l[2], s: l[3]};
};
export const toScreen = (f: Format, c: Cam, x: number, y: number) => ({x: (x - c.cx) * c.s + f.w / 2, y: (y - c.cy) * c.s + f.h / 2});
export const worldStyle = (f: Format, c: Cam): React.CSSProperties => ({position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0',
  transform: `translate(${f.w / 2 - c.cx * c.s}px, ${f.h / 2 - c.cy * c.s}px) scale(${c.s})`});

export const NOISE = 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%271.1%27 numOctaves=%273%27 stitchTiles=%27stitch%27/><feColorMatrix values=%270 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")';

// Путь курсора: [секунда, x, y] в координатах листа; между точками — лёгкая дуга, а не прямая.
export type Pt = [number, number, number];
export const track = (t: number, pts: Pt[]) => {
  if (!pts.length) return {x: 0, y: 0};
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
export const pressAt = (t: number, clicks: number[]) => clicks.reduce((m, c) => Math.max(m, interpolate(t, [c - 0.06, c, c + 0.12], [0, 1, 0], cl)), 0);

// Курсор агента: мятная стрелка, кольцо на щелчок, метка «Claude». У правого края кадра метка разворачивается влево.
export const AgentCursor: React.FC<{x: number; y: number; press?: number; ripple?: number[]; t?: number; o?: number; tag?: boolean; edge?: number}> =
  ({x, y, press = 0, ripple = [], t = 0, o = 1, tag = true, edge = 1120}) => {
    if (o <= 0) return null;
    const s = 1 - 0.14 * press;
    const flip = x > edge;
    return (
      <div style={{position: 'absolute', left: x, top: y, opacity: o, pointerEvents: 'none'}}>
        {ripple.map((c, i) => {
          const r = interpolate(t, [c, c + 0.45], [0, 1], cl);
          return r > 0 && r < 1 ? <div key={i} style={{position: 'absolute', left: -70 * r, top: -70 * r, width: 140 * r, height: 140 * r, borderRadius: '50%',
            border: `${5 * (1 - r) + 1}px solid ${MINT}`, opacity: 1 - r}} /> : null;
        })}
        <svg width={72} height={98} viewBox="0 0 52 70" style={{position: 'absolute', left: -4, top: -3, transformOrigin: '4px 3px', transform: `scale(${s})`,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))', overflow: 'visible'}}>
          <path d="M3 2 L3 54 L15 43 L24 64 L34 60 L25 40 L42 40 Z" fill={MINT} stroke={MINT_INK} strokeWidth={3.2} strokeLinejoin="round" />
        </svg>
        {tag ? (
          <div style={{position: 'absolute', left: flip ? -14 : 52, top: 78, transform: flip ? 'translateX(-100%)' : undefined,
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px 10px 12px', borderRadius: 999,
            background: MINT, boxShadow: '0 8px 20px rgba(0,0,0,.35)', whiteSpace: 'nowrap'}}>
            <span style={{width: 44, height: 44, borderRadius: 22, background: '#FFFFFF', display: 'grid', placeItems: 'center'}}><Mark name="claude" size={30} /></span>
            <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, color: MINT_INK}}>Claude</span>
          </div>
        ) : null}
      </div>
    );
  };
