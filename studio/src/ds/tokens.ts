// Дизайн-система ONai для видео 2K (1440×2560). Основа — HeroUI, поверх — наши токены глубины.
// Минимумы читаемости (сетка 1080 × 4/3): текст ≥ 42.7 px, лейблы ≥ 58.7 px, контраст ≥ 4.5:1.
export const color = {
  ink: '#07080A', text: '#F7F7F5', dim: '#B9BDBF', mint: '#3DEDC3', mintInk: '#05231D', orange: '#FF7A2F',
  danger: '#FF7478', ok: '#8DF0A5',
  // Палитра 18.09.2026: оранжевый, мятный, чёрный, белый. Синего и фиолетового нет.
  zoneGraphite: '#202326', zoneMint: '#0B3A31', zoneEmber: '#3A1A0A',
};
export const type = {caption: 53.3, label: 62, body: 48, headline: 230, figure: 290};
export const radius = {pill: 999, panel: 56};
// Уровни высоты: чем выше уровень, тем глубже тень и сильнее параллакс.
export const elevation = {
  1: '0 2px 4px rgba(0,0,0,.35), 0 12px 26px rgba(0,0,0,.38)',
  2: '0 3px 6px rgba(0,0,0,.38), 0 20px 44px rgba(0,0,0,.46), 0 44px 96px rgba(0,0,0,.30)',
  3: '0 4px 8px rgba(0,0,0,.40), 0 32px 64px rgba(0,0,0,.52), 0 80px 150px rgba(0,0,0,.36)',
} as const;
// Фаска: свет сверху, тень снизу — поверхность читается как объём, а не плоская плашка.
export const bevel = 'inset 0 2px 0 rgba(255,255,255,.24), inset 0 -3px 0 rgba(0,0,0,.38)';
export const surface = (tint = 'rgba(30,33,40,.94)') => ({
  background: `linear-gradient(180deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 55%), ${tint}`,
  border: '2px solid rgba(255,255,255,.16)',
});
export const textDepth = '0 2px 0 rgba(0,0,0,.40), 0 10px 24px rgba(0,0,0,.50)';

// Стекло (правка 18.09.2026): подложки полупрозрачные, 50–60% прозрачности, с размытием того, что за ними.
// solid — только ключевые моменты (боль, победа, призыв).
export const glass = {
  clear: {fill: 0.42, blur: 22, sat: 1.8},
  frosted: {fill: 0.55, blur: 30, sat: 1.6},
  solid: {fill: 1, blur: 0, sat: 1},
} as const;
export type Material = keyof typeof glass;
export const glassFill = (m: Material, rgb = '24,27,34') => ({
  background: `linear-gradient(180deg, rgba(255,255,255,${m === 'solid' ? 0.1 : 0.14}) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 100%), rgba(${rgb},${glass[m].fill})`,
  ...(glass[m].blur ? {backdropFilter: `blur(${glass[m].blur}px) saturate(${glass[m].sat})`, WebkitBackdropFilter: `blur(${glass[m].blur}px) saturate(${glass[m].sat})`} : {}),
});
