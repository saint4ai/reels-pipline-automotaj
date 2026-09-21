import React from 'react';
import {elevation, GlassLayers, glassFill, textDepth} from '../ds';

// Капсула из жидкого стекла с водой внутри (просьба Александра 19.09.2026: «капсульные подложки, наполнение воды внутри капсулы»).
// level 0…1 — уровень воды, slosh 0…1 — раскачка (растёт при сливе и наливе), t — секунды для волны и пузырей.
// Вода — SVG внутри скруглённой маски: две волны (передняя и задняя), пузыри поднимаются только под поверхностью.
// Стекло — стандартное стекло ONai (размытие фона, обод, блик), поэтому капсула лежит на любом фоне.
type Tone = 'mint' | 'orange' | 'white';
const WATER: Record<Tone, [string, string, string]> = {
  mint: ['#C8FFF0', '#3DEDC3', '#0B6E58'], orange: ['#FFD2B0', '#FF7A2F', '#8A3510'], white: ['#FFFFFF', '#E4E7EA', '#9BA1A8'],
};

export const LiquidCapsule: React.FC<{w: number; h: number; level: number; t: number; slosh?: number; tone?: Tone; label?: string; labelSize?: number;
  icon?: React.ReactNode; dim?: number; style?: React.CSSProperties}> =
  ({w, h, level, t, slosh = 0, tone = 'mint', label, labelSize, icon, dim = 0, style}) => {
    const id = `lc${React.useId().replace(/:/g, '')}`;
    const r = h / 2, pad = Math.max(6, h * 0.06), iw = w - pad * 2, ih = h - pad * 2;
    const surf = pad + ih * (1 - Math.max(0, Math.min(1, level)));
    const amp = (2 + slosh * 16) * Math.min(1.4, h / 180);
    // точки поверхности воды: две синусоиды разной частоты, чтобы волна не выглядела механической
    const surface = (phase: number, k: number) => {
      const pts: string[] = [];
      for (let x = 0; x <= w; x += 10) {
        const y = surf + amp * k * Math.sin((x / w) * Math.PI * 2 * 1.2 + t * 3.6 + phase) + amp * 0.45 * k * Math.sin((x / w) * Math.PI * 2 * 2.6 - t * 5.2 + phase);
        pts.push(`${x},${y.toFixed(1)}`);
      }
      return pts;
    };
    const body = (pts: string[]) => `M 0 ${h} L ${pts.join(' L ')} L ${w} ${h} Z`;
    const front = surface(0, 1), back = surface(1.7, 0.8);
    const [c0, c1, c2] = WATER[tone];
    const bubbles = Array.from({length: 9}, (_, i) => {
      const bx = pad + ((i * 37) % 100) / 100 * iw, sp = 30 + (i % 4) * 14;
      const by = h - pad - ((t * sp + i * 53) % Math.max(1, ih));
      return by > surf + 6 ? <circle key={i} cx={bx} cy={by} r={2 + (i % 3) * 1.6} fill="rgba(255,255,255,.55)" /> : null;
    });
    return (
      <div style={{position: 'relative', width: w, height: h, borderRadius: r, ...glassFill('clear', '16,18,20'), boxShadow: elevation[2], overflow: 'hidden',
        filter: dim ? `brightness(${1 - dim * 0.6}) saturate(${1 - dim * 0.5})` : undefined, ...style}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <clipPath id={`${id}c`}><rect x={pad} y={pad} width={iw} height={ih} rx={ih / 2} /></clipPath>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c0} /><stop offset="0.35" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
          </defs>
          <g clipPath={`url(#${id}c)`}>
            <path d={body(back)} fill={c1} opacity={0.45} />
            <path d={body(front)} fill={`url(#${id}g)`} />
            {/* светлая кромка поверхности */}
            <path d={`M ${front.join(' L ')}`} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth={3} />
            {bubbles}
          </g>
          {/* блик на стекле сверху — капсула читается как объём */}
          <rect x={pad + ih * 0.35} y={pad + ih * 0.12} width={iw - ih * 0.7} height={ih * 0.16} rx={ih * 0.08} fill="rgba(255,255,255,.28)" />
        </svg>
        <GlassLayers radius={r} />
        {label && (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: h * 0.12,
            fontFamily: 'Manrope', fontWeight: 800, fontSize: labelSize ?? Math.round(h * 0.34), color: '#F7F7F5', textShadow: textDepth, whiteSpace: 'nowrap'}}>
            {icon}{label}
          </div>
        )}
      </div>
    );
  };
