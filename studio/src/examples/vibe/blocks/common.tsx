import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {elevation, GlassLayers, glassFill, textDepth} from '../../../ds';

// Общее для блоков ролика 22: время в секундах, пружины от секунды, палитра, стеклянная плашка, фоны бренда ролика 19.
export const M = '#3DEDC3', MI = '#05231D', O = '#FF7A2F', TXT = '#F2F3F5', INK = '#0A0B0D';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const inOut = Easing.bezier(0.65, 0, 0.35, 1), easeIn = Easing.bezier(0.55, 0, 1, 0.45), out = Easing.bezier(0.16, 1, 0.3, 1);
export const iv = (t: number, a: number, b: number, from = 0, to = 1, e: (x: number) => number = inOut) =>
  interpolate(t, [a, b], [from, to], {...clamp, easing: e});
export const spr = (t: number, at: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {damping: 13, stiffness: 150, mass: 0.8}) =>
  spring({frame: Math.round((t - at) * 30), fps: 30, config: cfg});
// Локальное время блока: секунды от начала композиции.
export const useSec = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return f / fps; };

export const Glass: React.FC<{w?: number; h?: number; r?: number; light?: boolean; pad?: string; style?: React.CSSProperties; children?: React.ReactNode}> =
  ({w, h, r = 48, light = false, pad = '0', style, children}) => (
    <div style={{position: 'relative', width: w, height: h, borderRadius: r, padding: pad, boxSizing: 'border-box',
      ...glassFill(light ? 'frosted' : 'clear', light ? '255,255,255' : '16,18,20'), boxShadow: elevation[2], ...style}}>
      <GlassLayers radius={r} strength={light ? 0.8 : 1} />
      <div style={{position: 'relative', width: '100%', height: '100%'}}>{children}</div>
    </div>
  );

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties}> =
  ({children, size = 62, color = TXT, weight = 800, style}) => (
    <span style={{fontFamily: 'Manrope', fontWeight: weight, fontSize: size, color, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
      textShadow: color === TXT ? textDepth : 'none', ...style}}>{children}</span>
  );

// Мятная или оранжевая пилюля-метка со сплошной заливкой (ключевой момент).
export const Chip: React.FC<{children: React.ReactNode; tone?: 'mint' | 'orange' | 'white'; size?: number; style?: React.CSSProperties}> =
  ({children, tone = 'mint', size = 58, style}) => {
    const bg = {mint: M, orange: O, white: '#F2F3F5'}[tone], ink = {mint: MI, orange: '#1A0B03', white: '#101214'}[tone];
    return (
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: `${size * 0.26}px ${size * 0.62}px`, borderRadius: 999, background: bg, color: ink,
        fontFamily: 'Manrope', fontWeight: 800, fontSize: size, whiteSpace: 'nowrap', boxShadow: `inset 0 3px 0 rgba(255,255,255,.55), inset 0 -4px 0 rgba(0,0,0,.18), ${elevation[1]}`, ...style}}>{children}</span>
    );
  };

// Фоны бренда ролика 19 со световыми пятнами под стекло.
export const Zone: React.FC<{kind: 'black' | 'graphite' | 'white' | 'mint' | 'ember'; children?: React.ReactNode}> = ({kind, children}) => {
  const bg = {
    black: 'radial-gradient(90% 60% at 30% 20%, #1A1C1F 0%, #0B0C0E 55%, #050607 100%)',
    graphite: 'radial-gradient(90% 60% at 30% 20%, #3B3F45 0%, #24272B 50%, #141618 100%)',
    white: 'radial-gradient(100% 70% at 50% 25%, #FFFFFF 0%, #F1F2F0 55%, #DDE0DC 100%)',
    mint: 'radial-gradient(80% 55% at 50% 35%, #1FBF9A 0%, #0F6E5A 35%, #0B3A31 65%, #051A16 100%)',
    ember: 'radial-gradient(80% 55% at 50% 35%, #FF9A55 0%, #FF7A2F 22%, #A8431A 52%, #3A1A0A 80%, #140905 100%)',
  }[kind];
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{opacity: kind === 'white' ? 0.05 : 0.08, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27240%27 height=%27240%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")'}} />
      {children}
    </AbsoluteFill>
  );
};
