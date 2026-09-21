// Токены в пикселях вывода 2K (1440×2560). Сетка 1080×1920 × 4/3.
export const W = 1440, H = 2560, FPS = 30;
export const DURATION = Math.round(12.82 * FPS);
export const C = {
  text: '#F2F3F5', dim: '#A8AFB9', mint: '#3DEDC3', danger: '#FF5A5F', ok: '#7CE38B',
  node: '#1B1E24', nodeLine: 'rgba(255,255,255,.12)', dash: '#5A626E',
};
// Карточка спикера: три состояния из профиля layout-speaker-bottom-2026-09-18.
export const CARD = {
  base: {x: 288, y: 1701, w: 864, h: 819},
  compact: {x: 396, y: 1906, w: 648, h: 614},
  wide: {x: 215, y: 1562, w: 1010, h: 958},
};
export const RADIUS = 64;
export const CAPTION = {size: 53.3, lineHeight: 1.4, x: 160, w: 960, centerY: 1573};
// Сцена — время в секундах.
export const T = {aToB: 5.3, bToC: 7.1, work: 10.56, badges: 11.38};
