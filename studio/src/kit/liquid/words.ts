// Раскладка строки по словам через canvas measureText: заголовок, капсула и переход берут одни и те же прямоугольники.
// Меряется после загрузки шрифтов (useFontsReady), иначе ширины будут от запасного шрифта.
export type Box = {x: number; y: number; w: number; h: number};
export type WordBox = Box & {text: string; baseline: number};

let ctx: CanvasRenderingContext2D | null = null;
const c2d = () => (ctx ??= document.createElement('canvas').getContext('2d')!);

export const fontSpec = (weight: number, size: number, family: string) => `${weight} ${size}px "${family}"`;

// Ширина слова с трекингом (em). CSS добавляет трекинг и после последней буквы — здесь он не входит в ширину.
export const textWidth = (text: string, font: string, size: number, tracking = 0) => {
  const g = c2d();
  g.font = font;
  return g.measureText(text).width + tracking * size * Math.max(0, [...text].length - 1);
};

// Метрики шрифта: верх и низ строки (как у CSS line box), высота заглавной.
export const fontMetrics = (font: string) => {
  const g = c2d();
  g.font = font;
  const m = g.measureText('НЖ');
  return {ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent, cap: m.actualBoundingBoxAscent};
};

export type LineStyle = {family: string; weight: number; size: number; tracking?: number; lineHeight?: number; gap?: number};

// Одна строка: x — левый край, центр или правый край по align; y — верх строки.
export const layoutLine = (words: string[], s: LineStyle & {x: number; y: number; align?: 'left' | 'center' | 'right'}): WordBox[] => {
  const font = fontSpec(s.weight, s.size, s.family);
  const tr = s.tracking ?? 0;
  const widths = words.map((t) => textWidth(t, font, s.size, tr));
  const space = textWidth(' ', font, s.size) + tr * s.size * 2 + (s.gap ?? 0);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  const h = s.size * (s.lineHeight ?? 1.18);
  const {ascent, descent} = fontMetrics(font);
  const baseline = s.y + (h - (ascent + descent)) / 2 + ascent;
  let x = s.align === 'center' ? s.x - total / 2 : s.align === 'right' ? s.x - total : s.x;
  return words.map((text, i) => {
    const b = {text, x, y: s.y, w: widths[i], h, baseline};
    x += widths[i] + space;
    return b;
  });
};

// Прямоугольник, охватывающий слова i…j, с полями.
export const spanBox = (words: WordBox[], i: number, j = i, padX = 0, padY = 0): Box => {
  const a = words[i], b = words[j];
  return {x: a.x - padX, y: Math.min(a.y, b.y) - padY, w: b.x + b.w - a.x + padX * 2, h: Math.max(a.h, b.h) + padY * 2};
};
