import React from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from "remotion";

const FONT = "Benzin-ExtraBold, Benzin, sans-serif";
export const LIME = "#B6FF00";
export const ORANGE = "#FC5C02";

/* ─────────── 1. ХУК — заголовок собирается из полос ─────────── */
export const HookTitle: React.FC<{ line1: string; line2: string; accent: string }> =
({ line1, line2, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (d: number) => {
    const s = spring({ frame: frame - d, fps, config: { damping: 16, mass: 0.6 } });
    return { y: interpolate(s, [0, 1], [120, 0]), o: s, blur: interpolate(s, [0, 1], [14, 0]) };
  };
  const a = rise(0), b = rise(7);
  const bar = interpolate(frame, [14, 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
      <div style={{ transform: `translateY(${a.y}px)`, opacity: a.o, filter: `blur(${a.blur}px)`,
        fontFamily: FONT, fontSize: 96, color: "#fff", letterSpacing: -1, textAlign: "center", lineHeight: 1.05 }}>
        {line1}
      </div>
      <div style={{ height: 6, width: `${bar * 70}%`, background: accent, margin: "26px 0", borderRadius: 3 }} />
      <div style={{ transform: `translateY(${b.y}px)`, opacity: b.o, filter: `blur(${b.blur}px)`,
        fontFamily: FONT, fontSize: 96, color: accent, letterSpacing: -1, textAlign: "center", lineHeight: 1.05 }}>
        {line2}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 2. ЦИФРА — счётчик накручивается ─────────── */
export const BigNumber: React.FC<{ value: number; suffix: string; caption: string; accent: string }> =
({ value, suffix, caption, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200, mass: 3, stiffness: 60 } });
  const shown = Math.round(interpolate(p, [0, 1], [0, value]));
  const pop = spring({ frame: frame - 2, fps, config: { damping: 11, mass: 0.5 } });
  const capIn = interpolate(frame, [26, 44], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: `radial-gradient(620px 620px at 50% 46%, ${accent}22, transparent 70%)` }} />
      <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`, display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontFamily: FONT, fontSize: 260, color: "#fff", letterSpacing: -6, fontVariantNumeric: "tabular-nums" }}>
          {shown.toLocaleString("ru-RU")}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 110, color: accent }}>{suffix}</span>
      </div>
      <div style={{ opacity: capIn, transform: `translateY(${(1 - capIn) * 22}px)`,
        fontFamily: FONT, fontSize: 40, color: "rgba(255,255,255,0.62)", letterSpacing: 4, marginTop: 18 }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 3. ПРОТИВОПОСТАВЛЕНИЕ — два блока навстречу ─────────── */
export const VersusBlocks: React.FC<{ leftLabel: string; leftValue: string; rightLabel: string; rightValue: string }> =
({ leftLabel, leftValue, rightLabel, rightValue }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const l = spring({ frame, fps, config: { damping: 15, mass: 0.7 } });
  const r = spring({ frame: frame - 6, fps, config: { damping: 15, mass: 0.7 } });
  const strike = interpolate(frame, [34, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const Card: React.FC<{ p: number; from: number; label: string; value: string; color: string; dim?: boolean }> =
  ({ p, from, label, value, color, dim }) => (
    <div style={{ transform: `translateX(${interpolate(p, [0, 1], [from, 0])}px)`, opacity: p,
      background: dim ? "rgba(255,255,255,0.05)" : `${color}18`, border: `2px solid ${color}`,
      borderRadius: 26, padding: "34px 26px", width: 400, textAlign: "center", position: "relative" }}>
      <div style={{ fontFamily: FONT, fontSize: 26, color: "rgba(255,255,255,0.55)", letterSpacing: 3 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 76, color, marginTop: 10, position: "relative", display: "inline-block" }}>
        {value}
        {dim && <div style={{ position: "absolute", top: "52%", left: 0, height: 6, width: `${strike * 100}%`, background: color }} />}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 34 }}>
      <Card p={l} from={-width} label={leftLabel} value={leftValue} color={ORANGE} dim />
      <Card p={r} from={width} label={rightLabel} value={rightValue} color={LIME} />
    </AbsoluteFill>
  );
};

/* ─────────── 4. ФАКТ — плашка выезжает с наклоном ─────────── */
export const FactCard: React.FC<{ badge: string; text: string; accent: string }> =
({ badge, text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const rot = interpolate(s, [0, 1], [-8, 0]);
  const textIn = interpolate(frame, [10, 26], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      <div style={{ transform: `translateX(${interpolate(s, [0, 1], [500, 0])}px) rotate(${rot}deg)`, opacity: s,
        background: "rgba(255,255,255,0.05)", border: `2px solid ${accent}55`, borderRadius: 30, padding: 44, width: "100%" }}>
        <div style={{ display: "inline-block", background: accent, color: "#000", fontFamily: FONT,
          fontSize: 24, letterSpacing: 3, padding: "8px 18px", borderRadius: 10 }}>{badge}</div>
        <div style={{ opacity: textIn, transform: `translateY(${(1 - textIn) * 16}px)`,
          fontFamily: FONT, fontSize: 52, color: "#fff", lineHeight: 1.24, marginTop: 24 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 5. ЦИТАТА — печатается по словам ─────────── */
export const QuoteBlock: React.FC<{ quote: string; author: string; accent: string }> =
({ quote, author, accent }) => {
  const frame = useCurrentFrame();
  const words = quote.split(" ");
  const per = 3;
  const authorIn = interpolate(frame, [words.length * per + 8, words.length * per + 24], [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: "0 80px" }}>
      <div style={{ fontFamily: FONT, fontSize: 150, color: accent, lineHeight: 0.6, marginBottom: 20 }}>&laquo;</div>
      <div style={{ fontFamily: FONT, fontSize: 58, color: "#fff", lineHeight: 1.3, textAlign: "center" }}>
        {words.map((w, i) => {
          const o = interpolate(frame, [i * per, i * per + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return <span key={i} style={{ opacity: o, display: "inline-block", marginRight: 14,
            transform: `translateY(${(1 - o) * 14}px)` }}>{w}</span>;
        })}
      </div>
      <div style={{ opacity: authorIn, fontFamily: FONT, fontSize: 30, color: accent, letterSpacing: 4, marginTop: 34 }}>
        {author}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 6. СПИСОК — пункты влетают по очереди ─────────── */
export const Checklist: React.FC<{ title: string; items: string[]; accent: string }> =
({ title, items, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tIn = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ opacity: tIn, transform: `translateY(${interpolate(tIn, [0, 1], [40, 0])}px)`,
        fontFamily: FONT, fontSize: 62, color: "#fff", marginBottom: 46 }}>{title}</div>
      {items.map((it, i) => {
        const s = spring({ frame: frame - 12 - i * 8, fps, config: { damping: 15, mass: 0.6 } });
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26,
            opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-90, 0])}px)` }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: accent, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT, fontSize: 26, color: "#000" }}>{i + 1}</div>
            <div style={{ fontFamily: FONT, fontSize: 42, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>{it}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
