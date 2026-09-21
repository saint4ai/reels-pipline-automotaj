import {useCurrentFrame, useVideoConfig} from 'remotion';

// Ролик «ИИ-ассистент в директе» (videos/reels-19-direct-assistant/DIRECTION.md). Родные 60 fps записи.
export const FPS = 60;
export const END = 56.33;

// Стыки сцен: секунда начала перехода и его длина. Сцена i начинается со стыка i−1 и живёт до конца стыка i.
export const CUTS = [
  {at: 4.4, len: 0.33},   // портал в окно иллюминатора
  {at: 6.22, len: 0.4},   // рывок вбок
  {at: 11.0, len: 0.47},  // вспышка мятного
  {at: 14.45, len: 0.4},  // размытие через белый
  {at: 16.55, len: 0.47}, // сжатие в узел Zernio — вход в холст
  {at: 47.15, len: 0.4},  // уход вверх в тёмное
  {at: 51.0, len: 0.4},   // размытие через белый
];
export const STARTS = [0, ...CUTS.map((c) => c.at)];
const f = (s: number) => Math.round(s * FPS);
export const SCENE_FRAMES = STARTS.map((s, i) => (i < CUTS.length ? f(CUTS[i].at + CUTS[i].len) : f(END)) - f(s));
export const CUT_FRAMES = CUTS.map((c) => f(c.len));
export const DURATION = SCENE_FRAMES.reduce((a, b) => a + b, 0) - CUT_FRAMES.reduce((a, b) => a + b, 0);

// Время сцены: t — секунды ролика; A(сек) — момент в кадрах 30 fps от начала сцены (единица библиотеки kit).
export const useSceneTime = (t0: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = t0 + frame / fps;
  const A = (sec: number) => (sec - t0) * 30;
  return {t, A};
};
