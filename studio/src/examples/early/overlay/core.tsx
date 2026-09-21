import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { springs } from "../../../kit/remocn/lib/remocn-ui/motion";
import { FONT_STACK } from "./fonts";

/* ─────────── токены: единственный источник цвета и шрифта ─────────── */
export const LIME = "#B6FF00";    // результат, новое, выигрыш
export const ORANGE = "#FC5C02";  // боль, старое, отменённое
export const PAIN = "#FF4D3D";    // проблема
export const WARN = "#FFB020";    // промежуточный шаг
export const INK = "#0A0A0A";
export const FONT = FONT_STACK;

/** Безопасная зона вертикали: ниже 1450 — подпись и кнопки Reels, правее 940 — кнопки. */
export const SAFE = { top: 200, bottom: 1450, left: 60, right: 1020 } as const;

/* ─────────── окно жизни вставки: секунды → вход/выход ─────────── */
export type Window = { f: number; inS: number; out: number; life: number };

export const useWindow = (from: number, to: number): Window | null => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(from * fps);
  const life = Math.round((to - from) * fps);
  const inS = spring({ frame: f, fps, config: springs.snappy });
  const out = interpolate(f, [life - 8, life + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < -1 || f > life + 12) return null;
  return { f, inS, out, life };
};

/* ─────────── затемнение фона под тяжёлым приёмом ─────────── */
export const Scrim: React.FC<{ w: Window; to?: number; rampFrames?: number }> =
({ w, to = 0.62, rampFrames = 6 }) => {
  const dim = interpolate(w.f, [0, rampFrames], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * w.out;
  return <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />;
};

/* ─────────── расходящееся кольцо (было продублировано трижды) ─────────── */
export const Ring: React.FC<{ f: number; delay?: number; from?: number; to?: number; color: string; width?: number }> =
({ f, delay = 0, from = 100, to = 280, color, width = 2 }) => {
  const t = f - delay;
  const size = interpolate(t, [0, 24], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const opacity = interpolate(t, [0, 7, 26], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size,
      marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%",
      border: `${width}px solid ${color}`, opacity, pointerEvents: "none" }} />
  );
};

/* ─────────── прочерчивание линии/стрелки ─────────── */
export const DrawLine: React.FC<{
  f: number; delay?: number; frames?: number; d: string; color?: string; width?: number; length: number; arrow?: boolean;
}> = ({ f, delay = 0, frames = 8, d, color = ORANGE, width = 4, length, arrow = true }) => {
  const p = interpolate(f - delay, [0, frames], [length, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  return (
    <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none"
      strokeDasharray={length} strokeDashoffset={p} />
  );
};

/* ─────────── текст, который не переполняет кадр ─────────── */
export const Fit: React.FC<{ text: string; base: number; maxWidth: number; style?: React.CSSProperties }> =
({ text, base, maxWidth, style }) => {
  // fitFontSize импортируется лениво, чтобы core оставался без побочных зависимостей
  const size = fitSize(text, base, maxWidth);
  return <span style={{ fontFamily: FONT, fontSize: size, ...style }}>{text}</span>;
};

import { fitFontSize } from "../../../kit/remocn/lib/fitText";
const fitSize = (t: string, b: number, w: number) => fitFontSize(t, b, w);
