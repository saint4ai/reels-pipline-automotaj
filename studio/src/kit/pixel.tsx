import {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {Color, InstancedMesh, MeshPhysicalMaterial, Object3D} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {color, glassFill} from '../ds';
import {useFrame30} from './motion';
import {ObjectStage} from './three';

// Стиль «воксельное стекло» (проба 19.09.2026, «между Minecraft и Pixel Gun, но не крупные пиксели»):
// ступенчатые углы и обводки как в пиксель-арте, объёмные буквы со ступенчатой экструзией, предметы из кубиков
// с фаской и студийным светом (three.js), стекло с размытием. Картинка чёткая — пиксель только в форме, не в разрешении.
export const PIXEL_FONT = 'DotGothic16';
// Текст интерфейса: Handjet с квадратными элементами сетки. Узкий, поэтому длинные фразы влезают в окна.
export const uiFont = (size: number, weight = 600): React.CSSProperties => ({fontFamily: 'Handjet', fontWeight: weight, fontSize: size, fontVariationSettings: '"ELSH" 0, "ELGR" 1', lineHeight: 1.1});
// DotGothic16 — японский шрифт: кириллица в нём моноширинная во всю клетку (широкие поля), латиница и цифры — в полклетки.
// Поэтому трекинг сжимаем только у кириллицы, иначе «$20» и «Claude» слипаются.
export const pixFont = (size: number): React.CSSProperties => ({fontFamily: PIXEL_FONT, fontWeight: 400, fontSize: size, lineHeight: 1.1});
const CYR_RUN = /([\u0400-\u04FF]+)/;
export const PixText: React.FC<{children: string; track?: number}> = ({children, track = -0.2}) => {
  const parts = children.split(CYR_RUN);
  const endsCyr = CYR_RUN.test(children.slice(-1));
  return (
    <span style={{paddingRight: endsCyr ? `${-track}em` : 0}}>
      {parts.map((p, i) => (i % 2 === 1 ? <span key={i} style={{letterSpacing: `${track}em`}}>{p}</span> : p))}
    </span>
  );
};

// Многоугольник со ступенчатыми углами: на каждом углу лесенка из n ступенек размером step (обход по часовой стрелке).
export const stepPoly = (w: number, h: number, step: number, n: number): [number, number][] => {
  const tl: [number, number][] = [[0, n * step]];
  for (let i = 1; i <= n; i++) tl.push([i * step, (n - i + 1) * step], [i * step, (n - i) * step]);
  const tr = tl.map(([x, y]) => [w - x, y] as [number, number]).reverse();
  const br = tl.map(([x, y]) => [w - x, h - y] as [number, number]);
  const bl = tl.map(([x, y]) => [x, h - y] as [number, number]).reverse();
  return [...tl, ...tr, ...br, ...bl];
};
const toClip = (p: [number, number][]) => `polygon(${p.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
const toPath = (p: [number, number][]) => `M${p.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

// Стеклянная панель со ступенчатыми углами: размытие фона, светлая пиксельная обводка, ступенчатая тень снизу-справа.
export const PixelPanel: React.FC<{w: number; h: number; step?: number; n?: number; tint?: string; edge?: string; children?: React.ReactNode; style?: React.CSSProperties}> =
  ({w, h, step = 10, n = 3, tint = '16,18,22', edge = 'rgba(255,255,255,.55)', children, style}) => {
    const poly = useMemo(() => stepPoly(w, h, step, n), [w, h, step, n]);
    const gid = `pp-rim-${w}-${h}-${step}`;
    return (
      <div style={{position: 'relative', width: w, height: h, ...style}}>
        <div style={{position: 'absolute', left: step * 1.5, top: step * 1.5, width: w, height: h, clipPath: toClip(poly), background: 'rgba(0,0,0,.45)'}} />
        <div style={{position: 'absolute', inset: 0, clipPath: toClip(poly), ...glassFill('frosted', tint)}} />
        <div style={{position: 'absolute', inset: 0, clipPath: toClip(poly), background: 'linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 22%)'}} />
        <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* Кромка жидкого стекла: яркая сверху-слева (свет из верхнего левого угла), гаснет к нижнему правому. */}
          <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w} y2={h}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.45" stopColor={edge} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.18} />
          </linearGradient></defs>
          <path d={toPath(poly)} fill="none" stroke={`url(#${gid})`} strokeWidth={4} shapeRendering="crispEdges" />
          <path d={toPath(stepPoly(w - 16, h - 16, step, n).map(([x, y]) => [x + 8, y + 8] as [number, number]))} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={2} shapeRendering="crispEdges" />
        </svg>
        <div style={{position: 'relative', width: w, height: h}}>{children}</div>
      </div>
    );
  };

// Объёмные буквы со ступенчатой экструзией (жёсткие сдвиги без размытия), как заголовки Minecraft, но в высоком разрешении.
export const PixelText: React.FC<{children: string; size: number; face?: string; side?: string; depth?: number; style?: React.CSSProperties}> =
  ({children, size, face = '#F2F3F5', side = '#3F444D', depth = 7, style}) => {
    const d = Math.max(3, Math.round(size / 18));
    const layers = Array.from({length: depth}, (_, i) => `${(i + 1) * d * 0.5}px ${(i + 1) * d * 0.5}px 0 ${side}`).join(', ');
    return (
      <span style={{fontFamily: PIXEL_FONT, fontWeight: 400, fontSize: size, lineHeight: 1.05, color: face,
        textShadow: `${layers}, ${depth * d * 0.5 + 6}px ${depth * d * 0.5 + 14}px 26px rgba(0,0,0,.55)`, whiteSpace: 'nowrap', ...style}}><PixText>{children}</PixText></span>
    );
  };

// Фон «кодер»: тёмная база, мягкие цветные свечения под стекло, пиксельная сетка точек и бегущие строки кода.
const CODE = [
  '{ "mcpServers": {', '  "pipeboard": { "url": "https://ads.mcp.pipeboard.co/" },', '  "zernio":    { "type": "http" },',
  '  "amocrm":    { "tools": 36 },', '  "metabase":  { "insights": true }', '} }', '> claude: подключено 4 коннектора', '> воронка: реклама → заявки → сделки → деньги',
];
export const PixelBackdrop: React.FC<{glow?: [string, string]; codeOpacity?: number}> = ({glow = [color.orange, color.mint], codeOpacity = 0.16}) => {
  const f = useFrame30();
  return (
    <AbsoluteFill style={{background: '#0A0B0D', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 700px at 20% 25%, ${glow[0]}55, transparent 70%), radial-gradient(900px 800px at 85% 60%, ${glow[1]}40, transparent 70%)`}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)',
        backgroundSize: '48px 48px', backgroundPosition: `0 ${(f * 0.6) % 48}px`}} />
      <div style={{position: 'absolute', left: 60, top: -((f * 1.2) % 520), fontFamily: 'JBM', fontSize: 34, lineHeight: 1.6, color: color.mint, opacity: codeOpacity, whiteSpace: 'pre'}}>
        {[...CODE, ...CODE, ...CODE, ...CODE].join('\n')}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

// Пиксельный диск-свечение за стеклом: снаружи панели — чёткие ступеньки, сквозь стекло — размытое цветное пятно.
// Так стекло видно глазом (фон под ним меняется), а стиль остаётся пиксельным.
export const PixelOrb: React.FC<{r: number; cell?: number; from: string; to: string; opacity?: number}> = ({r, cell = 16, from, to, opacity = 1}) => {
  const n = Math.ceil(r / cell), gid = `orb-${r}-${from.slice(1)}`;
  const cells: [number, number][] = [];
  for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) if (Math.hypot(i + 0.5, j + 0.5) * cell <= r) cells.push([i, j]);
  return (
    <svg width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`} style={{display: 'block', opacity}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
      <g fill={`url(#${gid})`} shapeRendering="crispEdges">{cells.map(([i, j]) => <rect key={`${i}:${j}`} x={i * cell} y={j * cell} width={cell - 2} height={cell - 2} />)}</g>
    </svg>
  );
};

// Воксели: модель — список кубиков [x, y, z, индекс цвета]. Каждый кубик — скруглённый бокс с физическим материалом,
// всё одним InstancedMesh: сотни кубиков стоят как один объект.
export type Voxel = [number, number, number, number];
const VoxelMesh: React.FC<{voxels: Voxel[]; palette: string[]; size: number; rx: number; ry: number; center: [number, number, number]}> = ({voxels, palette, size, rx, ry, center}) => {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new RoundedBoxGeometry(size * 0.96, size * 0.96, size * 0.96, 3, size * 0.14), [size]);
  const mat = useMemo(() => new MeshPhysicalMaterial({roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.25}), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new Object3D(), c = new Color();
    voxels.forEach(([x, y, z, ci], i) => {
      o.position.set((x - center[0]) * size, (y - center[1]) * size, (z - center[2]) * size); o.updateMatrix();
      m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(palette[ci]));
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [voxels, palette, size, center]);
  return <group rotation={[rx, ry, 0]}><instancedMesh ref={ref} args={[geo, mat, voxels.length]} /></group>;
};
export const VoxelModel: React.FC<{voxels: Voxel[]; palette: string[]; size: number; w: number; h: number; rx?: number; ry?: number; pad?: number}> =
  ({voxels, palette, size, w, h, rx = 0, ry = 0, pad = 120}) => {
    const center = useMemo(() => {
      const xs = voxels.map((v) => v[0]), ys = voxels.map((v) => v[1]), zs = voxels.map((v) => v[2]);
      return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2] as [number, number, number];
    }, [voxels]);
    return (
      <div style={{position: 'relative', width: w, height: h}}>
        <ObjectStage w={w} h={h} pad={pad} env={0.8}><VoxelMesh voxels={voxels} palette={palette} size={size} rx={rx} ry={ry} center={center} /></ObjectStage>
      </div>
    );
  };

// Воксельная монета с пиксельным знаком $: диск 13×13 толщиной 2, знак выступает на третий слой.
export const coinVoxels = (): Voxel[] => {
  const v: Voxel[] = [];
  const glyph = ['..###..', '.#####.', '##.#...', '.####..', '...#.##', '.#####.', '..###..'];
  for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) {
    const r = Math.hypot(x, y);
    if (r > 6.4) continue;
    const rim = r > 5.2;
    v.push([x, y, 0, rim ? 1 : 0], [x, y, 1, rim ? 1 : 0]);
  }
  glyph.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') v.push([i - 3, 3 - j, 2, 2]); }));
  return v;
};
export const COIN_PALETTE = ['#FF9C5E', '#E8622A', '#FFE3C8'];

// Воксельный штекер: корпус, тёмный воротник, два металлических штыря влево и кабель лесенкой вправо-вниз.
export const plugVoxels = (cable = 14, drop = 4): Voxel[] => {
  const v: Voxel[] = [];
  for (let x = 0; x < 8; x++) for (let y = 0; y < 5; y++) for (let z = 0; z < 3; z++) v.push([x, y, z, y === 4 ? 1 : 0]);
  for (let y = 1; y < 4; y++) for (let z = 0; z < 3; z++) v.push([-1, y, z, 2]);
  for (let x = -4; x < -1; x++) { v.push([x, 1, 1, 3], [x, 3, 1, 3]); }
  let y = 2;
  for (let i = 0; i < cable; i++) {
    const x = 8 + i;
    if (i > cable * 0.4 && y > 2 - drop && i % 2 === 0) y -= 1;
    v.push([x, y, 1, 4]);
  }
  return v;
};
export const PLUG_PALETTE = ['#E9EBEE', '#FFFFFF', '#2A2E33', '#C9CED4', '#1B1E22'];
