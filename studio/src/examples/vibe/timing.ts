import TRANSCRIPT from './data/transcript.json';
import type {Page} from '../../components/Captions';

// Тайминги ролика 22 по записи IMG_7806 (60 fps, 72,7 с): границы блоков по словам и опорные точки.
// Каждый блок спроектирован в своём «внутреннем» времени; warp переводит реальное время блока во внутреннее кусочно-линейно
// по опорным словам — анимации попадают в слова без переписывания блоков.
export type Word = {text: string; start: number; end: number};
export const WORDS: Word[] = TRANSCRIPT as Word[];
export const REC_END = 72.75;
const w = (i: number) => WORDS[i].start;

export type BlockTiming = {start: number; end: number; anchors: [number, number][]}; // [внутреннее, реальное абсолютное]
export const TIMING: Record<string, BlockTiming> = {
  hook: {start: 0, end: w(8), anchors: [[0, 0], [2.1, w(6)], [3.3, w(8)]]},
  rewind: {start: w(8), end: w(19), anchors: [[0, w(8)], [0.55, w(10)], [2.6, w(17)], [4.5, w(19)]]},
  mirror: {start: w(19), end: w(45), anchors: [[0, w(19)], [0.6, w(21)], [1.9, w(22)], [3.1, w(27)], [7.2, w(42)], [10.6, w(45)]]},
  deck: {start: w(45), end: w(75), anchors: [[0, w(45)], [2.6, w(52)], [7.4, w(64)], [10.3, w(71)], [12.1, w(75)]]},
  xray: {start: w(75), end: w(91), anchors: [[0, w(75)], [1.6, w(79)], [3.0, w(83)], [4.6, w(88)], [5.8, w(91)]]},
  slot: {start: w(91), end: w(117), anchors: [[0, w(91)], [2.9, w(99)], [3.7, w(100)], [6.9, w(108)], [8.2, w(113)], [10.7, w(117)]]},
  pour: {start: w(117), end: w(132), anchors: [[0, w(117)], [3.3, w(125)], [3.85, w(126)], [4.45, w(127)], [5.1, w(130)], [6.4, w(132)]]},
  explode: {start: w(132), end: w(141), anchors: [[0, w(132)], [4.1, w(141)]]},
  gift: {start: w(141), end: w(153), anchors: [[0, w(141)], [0.5, w(143)], [2.1, w(146)], [4.4, w(153)]]},
  tear: {start: w(153), end: w(161), anchors: [[0, w(153)], [1.6, w(157)], [3.5, w(160) + 0.3], [4.0, w(161)]]},
  cta: {start: w(161), end: REC_END, anchors: [[0, w(161)], [1.25, w(162) + 0.25], [1.7, w(165)], [2.6, w(169)], [4.6, w(175)], [7.6, REC_END]]},
};

// Реальное время от начала блока → внутреннее время сцены.
export const warp = (b: BlockTiming, tReal: number) => {
  const abs = b.start + tReal, a = b.anchors;
  if (abs <= a[0][1]) return a[0][0] + (abs - a[0][1]);
  for (let i = 1; i < a.length; i++) {
    if (abs <= a[i][1]) {
      const [d0, r0] = a[i - 1], [d1, r1] = a[i];
      return d0 + ((abs - r0) / Math.max(0.001, r1 - r0)) * (d1 - d0);
    }
  }
  const [dl, rl] = a[a.length - 1];
  return dl + (abs - rl);
};

// Слова блока во времени блока и страницы субтитров: не больше двух строк (≈ 52 знака), разрыв после точки,
// после запятой при странице от 24 знаков; одна строка — до 32 знаков.
export const blockWords = (b: BlockTiming): Word[] =>
  WORDS.filter((x) => x.start >= b.start - 0.01 && x.start < b.end - 0.01).map((x) => ({text: x.text, start: x.start - b.start, end: x.end - b.start}));
export const blockPages = (ws: Word[], dur: number): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = (to: number) => {
    if (!cur.length) return;
    const len = cur.map((x) => x.text).join(' ').length;
    pages.push({from: cur[0].start - 0.05, to, lines: len <= 32 ? 1 : 2});
    cur = [];
  };
  ws.forEach((x, i) => {
    const len = [...cur, x].map((y) => y.text).join(' ').length;
    if (cur.length && len > 52) flush(x.start - 0.05);
    cur.push(x);
    const txt = cur.map((y) => y.text).join(' ');
    const next = ws[i + 1];
    if (next && (/[.!?]$/.test(x.text) || (/[,—]$/.test(x.text) && txt.length >= 24))) flush(next.start - 0.05);
  });
  flush(dur + 0.5);
  if (pages.length) pages[0].from = Math.min(pages[0].from, 0);
  return pages;
};
