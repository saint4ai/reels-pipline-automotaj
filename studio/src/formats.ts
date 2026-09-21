// Форматы вывода. Агент спрашивает владельца «рилс или ролик для YouTube» первым вопросом и берёт профиль отсюда.
// Все координаты — в пикселях композиции (2K). 4K — только по просьбе: remotion.config.ts → Config.setScale(1.5).
export type FormatId = 'reels' | 'youtube';
export type Box = {x: number; y: number; w: number; h: number};
export type SpeakerState = 'base' | 'compact' | 'wide';

export type Format = {
  id: FormatId;
  label: string;
  w: number;
  h: number;
  fps: number;
  // зона графики: сюда ложится карточка смыслового блока, спикер и субтитры её не перекрывают
  card: Box;
  // карточка спикера Screen Studio — три размера, переход 0,6 с по смене смыслового блока
  speaker: Record<SpeakerState, Box> & {radius: number};
  // субтитры: одна строка по центру cy, ширина строки не больше maxW
  captions: {cx: number; cy: number; maxW: number; size: number};
  // шаг листов на холсте: лист = кадр целиком, между листами — стол
  step: {x: number; y: number};
};

export const FORMATS: Record<FormatId, Format> = {
  // Рилс / Shorts / TikTok 9:16. Спикер внизу по центру, графика над ним, субтитры между ними.
  reels: {
    id: 'reels', label: 'Рилс 9:16 — 1440×2560', w: 1440, h: 2560, fps: 60,
    card: {x: 80, y: 290, w: 1280, h: 1090},
    speaker: {
      base: {x: 288, y: 1701, w: 864, h: 819},
      compact: {x: 396, y: 1906, w: 648, h: 614},
      wide: {x: 215, y: 1562, w: 1010, h: 958},
      radius: 64,
    },
    captions: {cx: 720, cy: 1467, maxW: 920, size: 53.3},
    step: {x: 2600, y: 3400},
  },
  // YouTube 16:9. Графика слева на две трети кадра, спикер справа снизу, субтитры под графикой.
  youtube: {
    id: 'youtube', label: 'YouTube 16:9 — 2560×1440', w: 2560, h: 1440, fps: 60,
    card: {x: 110, y: 110, w: 1580, h: 1060},
    speaker: {
      base: {x: 1790, y: 650, w: 660, h: 680},
      compact: {x: 1950, y: 890, w: 500, h: 440},
      wide: {x: 1740, y: 430, w: 760, h: 900},
      radius: 56,
    },
    captions: {cx: 900, cy: 1300, maxW: 1400, size: 56},
    step: {x: 3700, y: 2400},
  },
};
