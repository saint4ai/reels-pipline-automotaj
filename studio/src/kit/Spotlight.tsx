import React from 'react';
import {AbsoluteFill, random} from 'remotion';

// Прожектор (19.09.2026, концепция «Фокус»): темнота с круглым просветом, объёмный конус света с пылью и пятно на полу.
// Свет — склейка: сцена не режется, свет гаснет и загорается уже в новой. src — точка источника в кадре,
// x/y — куда падает луч, r — радиус пятна, on 0…1 — яркость (мерцание при включении задаёт вызывающий).
export const Spotlight: React.FC<{w: number; h: number; src: [number, number]; x: number; y: number; r: number; on: number; t: number; dim?: number; floorY?: number}> =
  ({w, h, src, x, y, r, on, t, dim = 0.88, floorY}) => {
    const [sx, sy] = src;
    const fy = floorY ?? y + r * 0.95;
    return (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {/* темнота везде, кроме пятна */}
        <AbsoluteFill style={{background: '#000', opacity: dim * Math.max(on, 0.001) + (1 - on) * dim,
          WebkitMaskImage: `radial-gradient(${r * 1.15}px ${r * 1.35}px at ${x}px ${y}px, transparent 0%, transparent ${55 * on}%, #000 100%)`,
          maskImage: `radial-gradient(${r * 1.15}px ${r * 1.35}px at ${x}px ${y}px, transparent 0%, transparent ${55 * on}%, #000 100%)`}} />
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: on}}>
          <defs>
            <linearGradient id="sp-cone" gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={x} y2={fy}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} /><stop offset="0.7" stopColor="#F2FFFB" stopOpacity={0.16} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.05} />
            </linearGradient>
            <filter id="sp-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={22} /></filter>
            <radialGradient id="sp-pool"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
          </defs>
          <polygon points={`${sx - 30},${sy} ${sx + 30},${sy} ${x + r},${fy} ${x - r},${fy}`} fill="url(#sp-cone)" filter="url(#sp-blur)" />
          <ellipse cx={x} cy={fy} rx={r * 1.1} ry={r * 0.22} fill="url(#sp-pool)" />
          {/* пыль в луче: точки внутри конуса, медленно плывут */}
          {Array.from({length: 46}, (_, i) => {
            const u = random(`sp-u${i}`), v = (random(`sp-v${i}`) + t * 0.03 * (0.5 + random(`sp-s${i}`))) % 1;
            const cx = sx + (x - sx) * v + (u - 0.5) * 2 * (30 + (r - 30) * v), cy = sy + (fy - sy) * v;
            return <circle key={i} cx={cx} cy={cy} r={1.2 + random(`sp-r${i}`) * 2.2} fill="#FFFFFF" opacity={0.25 + 0.45 * Math.abs(Math.sin(t * 1.3 + i))} />;
          })}
        </svg>
      </AbsoluteFill>
    );
  };
