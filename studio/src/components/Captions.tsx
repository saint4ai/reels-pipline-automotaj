import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {WORDS} from '../words';
import {C, CAPTION} from '../theme';

type Word = {text: string; start: number; end: number};
// Страница субтитров: секунды начала и конца, тёмный текст — на белых сценах, строк — 1 или 2 (задаёт высоту полосы).
export type Page = {from: number; to: number; dark?: boolean; lines?: 1 | 2};

// Страницы ролика «Коннекторы» по смыслу речи (секунды).
const CONNECTORS: Page[] = [[0, 2.2], [2.2, 3.78], [3.78, 5.3], [5.3, 7.1], [7.1, 8.95], [8.95, 11.37], [11.37, 13]].map(([from, to]) => ({from, to}));

// Субтитры 40 px сетки 1080 (53,3 в композиции 1440), светлые на тёмном и тёмные на светлом, подчёркивание текущего слова.
// Две строки — центр 1573, одна — 1467 (правило 18.09.2026: 1180 / 1100 в сетке 1080).
export const Captions: React.FC<{words?: Word[]; pages?: Page[]; width?: number}> = ({words = WORDS, pages = CONNECTORS, width = CAPTION.w}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const page = pages.find((p) => t >= p.from && t < p.to) ?? pages[pages.length - 1];
  const shown = words.filter((w) => w.start >= page.from - 0.01 && w.start < page.to);
  const enter = interpolate(t, [page.from, page.from + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const centerY = page.lines === 1 ? 1467 : CAPTION.centerY;
  const ink = page.dark ? '#101214' : C.text;
  const shadow = page.dark ? '0 2px 0 rgba(255,255,255,.7), 0 8px 22px rgba(0,0,0,.12)' : '0 2px 0 rgba(0,0,0,.45), 0 10px 26px rgba(0,0,0,.6)';
  return (
    <div style={{position: 'absolute', left: (1440 - width) / 2, width, top: centerY, translate: '0 -50%',
      textAlign: 'center', fontFamily: 'Manrope', fontWeight: 400, fontSize: CAPTION.size, lineHeight: CAPTION.lineHeight,
      color: ink, opacity: enter, filter: `blur(${(1 - enter) * 8}px)`, textShadow: shadow}}>
      {shown.map((w, i) => {
        const next = shown[i + 1]?.start ?? w.end + 0.4;
        const a = w.start - 0.04, b = a + 0.08, c = Math.max(b + 0.01, next - 0.04), d = c + 0.08;
        const on = interpolate(t, [a, b, c, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', marginRight: '0.28em'}}>
            {w.text}
            <span style={{position: 'absolute', left: 0, right: 0, bottom: -6, height: 5, borderRadius: 3, background: C.mint,
              scale: `${on} 1`, transformOrigin: 'left center', opacity: on}} />
          </span>
        );
      })}
    </div>
  );
};
