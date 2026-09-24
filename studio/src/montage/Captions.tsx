import {useMemo} from 'react';
import {Easing, getInputProps, interpolate} from 'remotion';
import {GlassSurface} from '../kit/liquid/LiquidPanel';
import {useFontsReady} from '../kit/liquid/useAssetReady';
import {fontSpec, layoutLine, textWidth} from '../kit/liquid/words';
import {WORDS, type Word} from './words';

// Субтитры ролика 21: стеклянная капсула под текущей строкой (решение Александра 19.09.2026).
// 40 px сетки 1080 = 53,3 px в 2K, светлый текст на тёмном стекле, мятное подчёркивание произносимого слова.
// Строка — фраза речи: рвётся по концу предложения, по запятой после 3+ слов, по паузе > 0,45 с и по ширине 940 px.
// Капсула перетекает по ширине от строки к строке. Одна строка — centerY 1467 (1100 сетки 1080).
// Лежит поверх сцен и переходов, поэтому размытие — обычный backdrop-filter (в масштабе 1 он кадр-в-кадр, O-24).
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const flow = Easing.bezier(0.65, 0, 0.35, 1);
const SIZE = 53.3, WEIGHT = 600, FAMILY = 'Manrope', MAXW = 920, CY = 1467, PADY = 18;
// Формат задаёт центр строки, ширину и кегль: рилс — 720/1467/920/53,3, YouTube — src/formats.ts.

type Line = {ids: number[]; from: number; to: number; w: number};

const buildLines = (ws: Word[], maxW: number, size: number): Line[] => {
  const FONT = fontSpec(WEIGHT, size, FAMILY);
  const groups: number[][] = [];
  let cur: number[] = [];
  const width = (ids: number[]) => textWidth(ids.map((i) => ws[i].text).join(' '), FONT, size);
  ws.forEach((w, i) => {
    if (cur.length) {
      const prev = ws[i - 1];
      const brk = /[.!?]$/.test(prev.text) || w.start - prev.end > 0.45 || (/[,:;—]$/.test(prev.text) && cur.length >= 3) || width([...cur, i]) > maxW || cur.length >= 5;
      if (brk) { groups.push(cur); cur = []; }
    }
    cur.push(i);
  });
  if (cur.length) groups.push(cur);
  return groups.map((ids, g) => {
    const from = ws[ids[0]].start - 0.06;
    const last = ws[ids[ids.length - 1]];
    const next = groups[g + 1] ? ws[groups[g + 1][0]].start - 0.06 : last.end + 0.6;
    return {ids, from, to: next - from > 1.1 + (last.end - from) ? last.end + 0.45 : next, w: width(ids)};
  });
};

// Ширина капсулы в момент t. Капсула перетекает по ширине от строки к строке за 0,22 с, но НИКОГДА не уже видимого
// текста: пока растёт под более длинную строку, текст новой строки ждёт (delay), а если текст уже виден — капсула
// берёт его ширину сразу. Правило Александра 24.09.2026: текст не выходит за контейнер ни в одном кадре.
export const capsuleAt = (lines: Line[], li: number, t: number, padX: number) => {
  const line = lines[li];
  const prev = li > 0 && Math.abs(lines[li - 1].to - line.from) < 0.02 ? lines[li - 1] : null;
  const k = interpolate(t, [line.from, line.from + 0.22], [0, 1], {...clamp, easing: flow});
  const delay = prev && line.w > prev.w ? 0.16 : 0;
  const textIn = interpolate(t, [line.from + delay, line.from + delay + 0.16], [0, 1], {...clamp, easing: ease});
  const morph = prev ? prev.w + (line.w - prev.w) * k : line.w;
  const w = Math.max(morph, textIn > 0 ? line.w : 0) + padX * 2;
  return {w, textIn, prev};
};

// Проверка всех стыков строк с шагом 1/120 с (qa-fit смотрит кадры раз в 0,5 с и короткий стык пропускает):
// поля капсулы вокруг видимого текста — не меньше 0,4 кегля. Нарушение пишется в консоль как [fit].
const checkCapsules = (lines: Line[], padX: number, size: number) => {
  lines.forEach((line, li) => {
    for (let t = line.from; t < Math.min(line.to, line.from + 0.6); t += 1 / 120) {
      const {w, textIn} = capsuleAt(lines, li, t, padX);
      if (textIn > 0 && (w - line.w) / 2 < size * 0.4 - 0.5) {
        console.error(`[fit] caption:${li}: капсула ${Math.round(w)} px уже текста ${Math.round(line.w)} px + поля в ${t.toFixed(2)} с`);
        break;
      }
    }
  });
};

export const Captions: React.FC<{t: number; grow?: (t: number) => number; words?: Word[]; cx?: number; cy?: number; maxW?: number; size?: number; frameW?: number; frameH?: number; light?: boolean}> =
  ({t, grow, words = WORDS, cx = 720, cy = CY, maxW = MAXW, size = SIZE, frameW = 1440, frameH = 2560, light = false}) => {
  const SIZE = size, CY = cy, PADX = Math.max(48, size * 0.9);
  const ready = useFontsReady([fontSpec(WEIGHT, size, FAMILY)]);
  const lines = useMemo(() => (ready ? buildLines(words, maxW, size) : []), [ready, words, maxW, size]);
  useMemo(() => { if (lines.length && (getInputProps() as {qa?: boolean}).qa) checkCapsules(lines, PADX, size); }, [lines, PADX, size]);
  if (!lines.length) return null;
  const li = lines.findIndex((l) => t >= l.from && t < l.to);
  if (li < 0) return null;
  const line = lines[li];
  const {w, textIn, prev} = capsuleAt(lines, li, t, PADX);
  const h = SIZE * 1.22 + PADY * 2;
  const appear = prev ? 1 : interpolate(t, [line.from, line.from + 0.2], [0, 1], {...clamp, easing: ease});
  const contNext = !!lines[li + 1] && Math.abs(lines[li + 1].from - line.to) < 0.02;
  const fadeOut = contNext ? 1 : interpolate(t, [line.to - 0.16, line.to], [1, 0], clamp);
  const capVis = appear * fadeOut;
  const pop = 0.92 + 0.08 * appear;
  const boxes = layoutLine(line.ids.map((i) => words[i].text), {family: FAMILY, weight: WEIGHT, size: SIZE, x: cx, y: CY - (SIZE * 1.22) / 2, align: 'center', lineHeight: 1.22});
  const s = grow ? grow(t) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: frameW, height: frameH, pointerEvents: 'none', transformOrigin: `${cx}px ${CY}px`, transform: s !== 1 ? `scale(${s})` : undefined}}>
      <div style={{position: 'absolute', left: cx - w / 2, top: CY - h / 2, width: w, height: h, borderRadius: h / 2, overflow: 'hidden',
        opacity: capVis, transform: `scale(${pop})`,
        backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
        boxShadow: '0 3px 6px rgba(0,0,0,.3), 0 18px 40px rgba(0,0,0,.4)'}}>
        <GlassSurface radius={h / 2} tone={light ? 'light' : 'dark'} fill={light ? 0.72 : 0.5} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: frameW, height: frameH, transformOrigin: `${cx}px ${CY}px`, transform: pop !== 1 ? `scale(${pop})` : undefined}}>
      {boxes.map((b, i) => {
        const id = line.ids[i], wd = words[id];
        const next = words[id + 1]?.start ?? wd.end + 0.4;
        const a = wd.start - 0.04, bb = a + 0.1, c = Math.max(bb + 0.01, Math.min(next, wd.end + 0.25) - 0.04), d = c + 0.1;
        const on = interpolate(t, [a, bb, c, d], [0, 1, 1, 0], clamp);
        return (
          <span key={id} style={{position: 'absolute', left: b.x, top: b.y, height: b.h, lineHeight: `${b.h}px`, whiteSpace: 'nowrap',
            fontFamily: FAMILY, fontWeight: WEIGHT, fontSize: SIZE, color: light ? '#15181B' : '#F2F3F5', opacity: textIn * fadeOut,
            filter: textIn < 1 ? `blur(${(1 - textIn) * 6}px)` : undefined, transform: `translateY(${(1 - textIn) * 8}px)`,
            textShadow: light ? '0 1px 0 rgba(255,255,255,.8)' : '0 2px 0 rgba(0,0,0,.35), 0 8px 18px rgba(0,0,0,.45)'}}>
            {b.text}
            <span style={{position: 'absolute', left: 0, right: 0, bottom: 6, height: 5, borderRadius: 3, background: light ? '#FF7A2F' : '#3DEDC3',
              transform: `scaleX(${on})`, transformOrigin: 'left center', opacity: on, boxShadow: '0 0 10px rgba(61,237,195,.6)'}} />
          </span>
        );
      })}
      </div>
    </div>
  );
};
