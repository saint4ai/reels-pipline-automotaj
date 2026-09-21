import {Easing, interpolate, spring} from 'remotion';
import {useFit} from '../ds/useFit';
import {E, k, Logo, NUM, SANS} from '../montage/parts';
import type {Box} from '../formats';
import type {BlockData} from '../template/blocks';

// Общие детали сцен для стилей: слова с входом, рисуемая линия, пружина от секунды, плитка логотипа, геометрия блоков.
export {E, k, NUM, SANS};
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// пружина от секунды: 0 → 1 с одним превышением (PRISM: короткое превышение и один затухающий отклик)
export const springAt = (t: number, at: number, fps = 60, damping = 14, stiffness = 170) =>
  t < at ? 0 : spring({frame: (t - at) * fps, fps, config: {damping, stiffness, mass: 0.8}});

// Заголовок по словам: каждое слово поднимается из размытия; accent — слово, выделенное цветом
export const Words: React.FC<{t: number; at: number; text: string; size: number; color: string; x: number; y: number; w?: number; weight?: number;
  family?: string; align?: 'left' | 'center'; accent?: string; accentColor?: string; step?: number; strike?: {word: string; at: number; color: string}; shadow?: string;
  lineHeight?: number; tracking?: string}> = (p) => {
  const {t, at, text, size, color, x, y, w, weight = 800, family = SANS, align = 'left', step = 0.12, lineHeight = 1.08, tracking = '-0.035em'} = p;
  const ws = text.split(' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, fontFamily: family, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: tracking,
      color, textShadow: p.shadow}}>
      {ws.map((wd, i) => {
        const a = k(t, at + i * step, at + i * step + 0.4, E.out);
        const struck = p.strike && wd === p.strike.word ? k(t, p.strike.at, p.strike.at + 0.35, E.inOut) : 0;
        const acc = p.accent && wd.replace(/[.,!?:«»]/g, '') === p.accent;
        return (
          <span key={i} style={{display: 'inline-block', position: 'relative', marginRight: '0.26em', opacity: a, transform: `translateY(${(1 - a) * size * 0.3}px)`,
            filter: a < 1 ? `blur(${(1 - a) * 10}px)` : undefined, color: acc ? p.accentColor : struck > 0.5 ? `${color}66` : undefined}}>
            {wd}
            {struck > 0 ? <span style={{position: 'absolute', left: -6, right: -6, top: '54%', height: size * 0.08, borderRadius: size, background: p.strike!.color,
              transformOrigin: 'left center', transform: `scaleX(${struck}) rotate(-3deg)`}} /> : null}
          </span>
        );
      })}
    </div>
  );
};

// Линия, которая рисуется за время a…b (обводка, подчёркивание, стрелка)
export const Draw: React.FC<{t: number; a: number; b: number; d: string; color: string; width: number; w: number; h: number; glow?: string; dash?: string; cap?: 'round' | 'butt'}> =
  ({t, a, b, d, color, width, w, h, glow, dash, cap = 'round'}) => {
    const p = k(t, a, b, Easing.bezier(0.65, 0, 0.35, 1));
    if (p <= 0) return null;
    return (
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        <defs><mask id={`m${Math.round(a * 1000)}${d.length}`}><path d={d} fill="none" stroke="#fff" strokeWidth={width * 3} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap={cap} /></mask></defs>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap={cap} strokeLinejoin="round" strokeDasharray={dash}
          mask={dash ? `url(#m${Math.round(a * 1000)}${d.length})` : undefined} pathLength={dash ? undefined : 1} {...(dash ? {} : {strokeDasharray: `${p} 1`})}
          style={{filter: glow ? `drop-shadow(0 0 ${width * 1.6}px ${glow})` : undefined}} />
      </svg>
    );
  };

export const LogoTile: React.FC<{name: string; size: number; bg?: string; shadow?: string; radius?: number}> = ({name, size, bg = '#F4F5F2', shadow, radius}) => (
  <div style={{width: size, height: size, borderRadius: radius ?? size * 0.26, background: bg, display: 'grid', placeItems: 'center', flex: 'none',
    boxShadow: shadow ?? 'inset 0 2px 0 rgba(255,255,255,.7), 0 14px 30px rgba(0,0,0,.25)'}}>
    <Logo name={name} size={size * 0.56} />
  </div>
);

// Время появления элементов блока — одинаковое для всех стилей, чтобы звук и курсор совпадали
export const itemAt = (b: BlockData, i: number) => b.at + 0.35 + i * 0.16;
export const nodeAt = (b: BlockData, i: number) => b.at + 0.35 + i * 0.55;
export const titleOf = (b: BlockData) => b.kind === 'hook' ? b.lines.join(' ') : b.kind === 'stat' ? b.caption : b.kind === 'cta' ? b.note : b.title;
// строки блока в зоне: отступы и кегли от размера зоны, чтобы стиль работал и в 9:16, и в 16:9
export const scale = (z: Box) => Math.min(z.w / 1280, z.h / 1090);
export const numText = (b: Extract<BlockData, {kind: 'stat'}>, t: number) => {
  const v = Math.round(b.value * k(t, b.countAt, b.countAt + 1.3, E.out));
  return `${b.prefix ?? ''}${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${b.suffix ?? ''}`;
};
export const lerpBox = (a: Box, b: Box, p: number): Box => ({x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p)});
export const ramp = (t: number, a: number, b: number, from: number, to: number) => interpolate(t, [a, b], [from, to], cl);

// Контейнер под проверкой qa-fit: текст не вылезает, поля не меньше половины кегля (иначе FIT FAIL)
export const Fit: React.FC<{name: string; style: React.CSSProperties; children?: React.ReactNode}> = ({name, style, children}) => {
  const ref = useFit(name) as React.RefObject<HTMLDivElement>;
  return <div ref={ref} style={style}>{children}</div>;
};
