// Покадровая «рисованная» анимация: движение держится по step кадров (рисунок «на двойках»), дрожание — от детерминированного хеша.
export const DEFAULT_STEP = 2;
export const hash01 = (key: string): number => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
};
export const hashRange = (key: string, min: number, max: number): number => min + (max - min) * hash01(key);
export const steppedRamp = (frame: number, start: number, end: number, opts: {step?: number; easing?: (t: number) => number} = {}): number => {
  const step = opts.step ?? DEFAULT_STEP;
  const f = Math.floor(frame / step) * step;
  const t = Math.min(1, Math.max(0, (f - start) / Math.max(1, end - start)));
  return opts.easing ? opts.easing(t) : t;
};
