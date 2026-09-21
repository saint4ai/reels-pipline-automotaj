import React from 'react';
import {random} from 'remotion';

// Холст в клетку для режима «прогулка камеры» (просьба Александра 19.09.2026: «canvas-фон, сетчатый фон, гулять по canvas»).
// Бренд ролика 19: зоны графит / оранжевый / белый / мятный перетекают друг в друга, как части одного холста.
// Сетка двухцветная (светлые и тёмные линии сразу), поэтому читается и на тёмной, и на белой зоне; на пересечениях крупной
// сетки — крестики, как на макетной доске. Цветные сферы — чтобы жидкому стеклу было что размывать.
// Координаты — пиксели мира в композиции 1440×2560; слой кладётся внутрь слоя камеры.
export type CanvasZone = {x: number; y: number; kind: 'graphite' | 'ember' | 'white' | 'mint'; r?: number};
const ZONE_FILL: Record<CanvasZone['kind'], {base: string; orbs: [number, number, number, string][]}> = {
  graphite: {base: '#202326', orbs: [[-420, -380, 900, 'rgba(61,237,195,.20)'], [460, 320, 900, 'rgba(255,255,255,.08)']]},
  ember: {base: '#3A1A0A', orbs: [[-380, -300, 1000, 'rgba(255,122,47,.60)'], [420, 380, 900, 'rgba(255,154,85,.35)']]},
  white: {base: '#F3F4F2', orbs: [[-400, -320, 1100, 'rgba(255,255,255,1)'], [420, 420, 800, 'rgba(255,122,47,.16)']]},
  mint: {base: '#0B3A31', orbs: [[-380, -300, 1000, 'rgba(61,237,195,.55)'], [420, 380, 900, 'rgba(61,237,195,.22)']]},
};
export const GRID = {minor: 60, major: 240};

export const GridCanvas: React.FC<{zones: CanvasZone[]; world: {x: number; y: number; w: number; h: number}}> = ({zones, world}) => {
  const layers: string[] = [];
  for (const z of zones) {
    const f = ZONE_FILL[z.kind], r = z.r ?? 1500;
    for (const [dx, dy, rr, c] of f.orbs) layers.push(`radial-gradient(${rr}px ${rr}px at ${z.x + dx - world.x}px ${z.y + dy - world.y}px, ${c} 0%, transparent 70%)`);
    layers.push(`radial-gradient(${r}px ${r}px at ${z.x - world.x}px ${z.y - world.y}px, ${f.base} 0%, ${f.base} 38%, transparent 72%)`);
  }
  const line = (c: string, step: number, w: number) =>
    `repeating-linear-gradient(0deg, ${c} 0 ${w}px, transparent ${w}px ${step}px), repeating-linear-gradient(90deg, ${c} 0 ${w}px, transparent ${w}px ${step}px)`;
  // сетка привязана к миру: начало клеток в точке (0,0) мира
  const pos = `${-world.x % GRID.minor}px ${-world.y % GRID.minor}px`, posM = `${-world.x % GRID.major}px ${-world.y % GRID.major}px`;
  return (
    <div style={{position: 'absolute', left: world.x, top: world.y, width: world.w, height: world.h, background: [...layers, '#0D0E10'].join(', ')}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: `${line('rgba(255,255,255,.05)', GRID.minor, 2)}, ${line('rgba(0,0,0,.05)', GRID.minor, 2)}`, backgroundPosition: `${pos}, ${pos}, ${pos}, ${pos}`}} />
      <div style={{position: 'absolute', inset: 0, backgroundImage: `${line('rgba(255,255,255,.10)', GRID.major, 3)}, ${line('rgba(0,0,0,.09)', GRID.major, 3)}`, backgroundPosition: `${posM}, ${posM}, ${posM}, ${posM}`}} />
      {/* крестики на пересечениях крупной сетки */}
      <svg width={world.w} height={world.h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="gc-cross" x={-world.x % GRID.major - 18} y={-world.y % GRID.major - 18} width={GRID.major} height={GRID.major} patternUnits="userSpaceOnUse">
            <path d="M18 6 V30 M6 18 H30" stroke="rgba(128,128,128,.55)" strokeWidth={3} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gc-cross)" />
      </svg>
      {/* шум, чтобы заливки не были пластиковыми */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27240%27 height=%27240%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")'}} />
    </div>
  );
};

// Ближний слой пыли: едет быстрее камеры (параллакс 1,25) — глубина при переездах.
export const DustLayer: React.FC<{world: {x: number; y: number; w: number; h: number}; n?: number}> = ({world, n = 90}) => (
  <div style={{position: 'absolute', left: world.x, top: world.y, width: world.w, height: world.h}}>
    {Array.from({length: n}, (_, i) => {
      const s = 4 + random(`ds${i}`) * 8;
      return <div key={i} style={{position: 'absolute', left: random(`dx${i}`) * world.w, top: random(`dy${i}`) * world.h, width: s, height: s, borderRadius: '50%',
        background: i % 3 ? 'rgba(255,255,255,.45)' : 'rgba(61,237,195,.55)', filter: 'blur(1.5px)'}} />;
    })}
  </div>
);
