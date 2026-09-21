import {useMemo} from 'react';
import {Easing, interpolate} from 'remotion';
import {LiquidPanel, type LiquidProps} from './LiquidPanel';
import {useFontsReady} from './useAssetReady';
import {fontSpec, layoutLine, spanBox, type Box, type LineStyle, type WordBox} from './words';

// Строка с жидкой капсулой-выделением: капсула по реальной ширине слов, перетекает от слова к слову —
// передний край уходит первым, задний догоняет, в растяжке капсула чуть сплющивается (поверхностное натяжение).
// Появление — капля у начала слова растекается до его конца. Слова под капсулой меняют цвет.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const flow = Easing.bezier(0.65, 0, 0.35, 1);

export type CapsuleStop = {at: number; i: number; j?: number} | {at: number; hide: true};

export const capsuleAt = (words: WordBox[], stops: CapsuleStop[], t: number, padX: number, padY: number, dur = 0.5): (Box & {on: number[]; vis: number}) | null => {
  let cur: Box | null = null, on: number[] = [], vis = 0;
  for (let s = 0; s < stops.length; s++) {
    const st = stops[s];
    if (t < st.at) break;
    if ('hide' in st) {
      if (!cur) continue;
      const k = interpolate(t, [st.at, st.at + dur * 0.6], [0, 1], {...clamp, easing: flow});
      const end = cur.x + cur.w;
      const w = Math.max(cur.h, cur.w * (1 - k));
      cur = {...cur, x: end - w, w};
      vis = 1 - interpolate(t, [st.at + dur * 0.35, st.at + dur * 0.6], [0, 1], clamp);
      on = k < 0.5 ? on : [];
      continue;
    }
    const target = spanBox(words, st.i, st.j ?? st.i, padX, padY);
    const ids = Array.from({length: (st.j ?? st.i) - st.i + 1}, (_, q) => st.i + q);
    if (!cur || vis === 0) {
      // капля у начала слова растекается вправо
      const k = interpolate(t, [st.at, st.at + dur], [0, 1], {...clamp, easing: flow});
      const w = target.h + (target.w - target.h) * k;
      const grow = interpolate(t, [st.at, st.at + dur * 0.3], [0.3, 1], {...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1)});
      cur = {x: target.x, y: target.y + (target.h * (1 - grow)) / 2, w: w * (grow < 1 ? grow : 1), h: target.h * grow};
      vis = interpolate(t, [st.at, st.at + 0.12], [0, 1], clamp);
      on = k > 0.35 ? ids : [];
      continue;
    }
    const from = cur;
    const right = target.x + target.w / 2 >= from.x + from.w / 2;
    const lead = interpolate(t, [st.at, st.at + dur * 0.72], [0, 1], {...clamp, easing: flow});
    const trail = interpolate(t, [st.at + dur * 0.28, st.at + dur], [0, 1], {...clamp, easing: flow});
    const L = from.x + (target.x - from.x) * (right ? trail : lead);
    const R = from.x + from.w + (target.x + target.w - from.x - from.w) * (right ? lead : trail);
    const stretch = Math.max(0, (R - L) - Math.max(from.w, target.w)) / Math.max(1, target.w);
    const h = target.h * (1 - Math.min(0.14, stretch * 0.25));
    cur = {x: L, y: target.y + (target.h - h) / 2, w: R - L, h};
    on = lead > 0.5 ? ids : on;
    vis = 1;
  }
  return cur && vis > 0 ? {...cur, on, vis} : null;
};

export type CapsuleLineProps = {
  words: string[]; t: number; stops: CapsuleStop[];
  style: LineStyle & {x: number; y: number; align?: 'left' | 'center' | 'right'};
  color?: string; activeColor?: string;
  padX?: number; padY?: number;
  capsule?: Omit<LiquidProps, 'x' | 'y' | 'w' | 'h'>;
  textShadow?: string;
  wordStyle?: (i: number) => React.CSSProperties | undefined;
};

export const useLine = (words: string[], style: CapsuleLineProps['style']) => {
  const ready = useFontsReady([fontSpec(style.weight, style.size, style.family)]);
  return useMemo(() => (ready ? layoutLine(words, style) : []), [ready, words.join(' '), style.x, style.y, style.size, style.weight, style.family, style.align, style.tracking, style.gap]);
};

export const CapsuleLine: React.FC<CapsuleLineProps> = (p) => {
  // Поля капсулы с запасом (правка Александра 20.09.2026: «капсулы шире — текст местами чуть вылезает»):
  // advance-ширина слова не учитывает выносы глифов и сглаживание, поэтому 0,4 кегля по бокам и 0,12 сверху/снизу.
  const padX = p.padX ?? p.style.size * 0.4, padY = p.padY ?? p.style.size * 0.12;
  // слова раздвинуты на поля капсулы, иначе капсула наезжает на соседнее слово
  const boxes = useLine(p.words, {...p.style, gap: p.style.gap ?? padX * 1.1});
  if (!boxes.length) return null;
  const cap = capsuleAt(boxes, p.stops, p.t, padX, padY);
  return (
    <>
      {cap ? <LiquidPanel {...(p.capsule ?? {material: 'solid', tone: 'mint'})} x={cap.x} y={cap.y} w={cap.w} h={cap.h} r="pill" opacity={cap.vis} /> : null}
      {boxes.map((b, i) => (
        <span key={i} style={{position: 'absolute', left: b.x, top: b.y, height: b.h, lineHeight: `${b.h}px`, whiteSpace: 'nowrap',
          fontFamily: p.style.family, fontWeight: p.style.weight, fontSize: p.style.size, letterSpacing: `${p.style.tracking ?? 0}em`,
          color: cap?.on.includes(i) ? p.activeColor ?? '#05231D' : p.color ?? '#F7F7F5', textShadow: cap?.on.includes(i) ? 'none' : p.textShadow,
          ...p.wordStyle?.(i)}}>{b.text}</span>
      ))}
    </>
  );
};
