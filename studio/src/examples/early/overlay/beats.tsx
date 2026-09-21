import React from "react";
import { AbsoluteFill, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { springs } from "../../../kit/remocn/lib/remocn-ui/motion";
import { fitText, fitTextOnNLines, measureText } from "@remotion/layout-utils";
import { useWindow, Scrim, Ring, DrawLine, FONT, LIME, ORANGE, PAIN, WARN } from "./core";


/** Кегль под ширину: реальный замер глифов, потолок — базовый размер. */
const fit = (text: string, base: number, maxWidth: number) =>
  Math.min(base, fitText({ text, withinWidth: maxWidth, fontFamily: FONT, fontWeight: 800 }).fontSize);

/** Для длинных фраз: разрешаем перенос на N строк, иначе кегль падает до нечитаемого. */
const fitLines = (text: string, base: number, maxWidth: number, maxLines = 3) =>
  fitTextOnNLines({ text, maxBoxWidth: maxWidth, maxLines, fontFamily: FONT, fontWeight: 800, maxFontSize: base }).fontSize;

/* ══════════ 1. ВОРОНКА — мысль собирается по шагам и сужается ══════════
   Ключевое отличие от «плашки в плашки»: прежние пункты НЕ исчезают,
   а демотируются. К концу фразы на экране вся конструкция целиком. */
export type FunnelStep = { at: number; text: string; color?: string };

export const Funnel: React.FC<{ from: number; to: number; steps: FunnelStep[]; title?: string }> =
({ from, to, steps, title }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const active = steps.reduce((n, s, i) => (w.f >= Math.round((s.at - from) * fps) ? i : n), -1);

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.66} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {title && (
          <div style={{ fontFamily: FONT, fontSize: 34, letterSpacing: 5, color: "rgba(255,255,255,0.5)",
            opacity: interpolate(w.f, [2, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            marginBottom: 10 }}>{title}</div>
        )}
        {steps.map((s, i) => {
          const start = Math.round((s.at - from) * fps);
          const sp = spring({ frame: w.f - start, fps, config: springs.snappy });
          if (w.f < start - 1) return null;
          const isActive = i === active;
          const dim = isActive ? 1 : interpolate(w.f - start, [0, 10], [1, 0.42], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const blur = isActive ? 0 : interpolate(w.f - start, [0, 10], [0, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const scale = interpolate(sp, [0, 1], [0.94, 1]) * (isActive ? 1 : 0.975);
          const width = 960 - i * 74;                    // сужение — это и есть воронка
          const color = s.color ?? (i === steps.length - 1 ? LIME : i === 0 ? PAIN : WARN);
          const size = fit(s.text, 58, width - 130);
          return (
            <div key={i} style={{ width, opacity: sp * dim, filter: blur ? `blur(${blur}px)` : undefined,
              transform: `translateY(${interpolate(sp, [0, 1], [38, 0])}px) scale(${scale})`,
              display: "flex", alignItems: "center", gap: 18,
              background: "rgba(10,10,10,0.92)", border: `2px solid ${color}`, borderRadius: 20,
              padding: "18px 26px", boxShadow: `0 0 46px -20px ${color}` }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: color, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontSize: 26, color: "#000" }}>{i + 1}</div>
              <div style={{ fontFamily: FONT, fontSize: size, color: "#fff", lineHeight: 1.14 }}>{s.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 2. СХЛОП В ВЫВОД — накопленное сжимается в итог ══════════ */
export const Collapse: React.FC<{ from: number; to: number; items: string[]; result: string }> =
({ from, to, items, result }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const suck = Math.round(0.9 * fps);                    // когда начинается всасывание
  const resFrame = suck + 8;
  const resSp = spring({ frame: w.f - resFrame, fps, config: springs.bouncy });
  const wipe = interpolate(w.f - resFrame, [0, 7], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.7} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {items.map((t, i) => {
          const enter = spring({ frame: w.f - i * 6, fps, config: springs.soft });
          const g = interpolate(w.f - suck - (items.length - 1 - i) * 2, [0, 10], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pull = (items.length / 2 - i) * 70 * g;   // тянутся к центру
          return (
            <div key={i} style={{ opacity: enter * (1 - g),
              transform: `translateY(${interpolate(enter, [0, 1], [26, 0]) + pull}px) scale(${1 - g * 0.15})`,
              fontFamily: FONT, fontSize: 48, color: "rgba(255,255,255,0.92)",
              background: "rgba(12,12,12,0.86)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 16, padding: "14px 26px" }}>{t}</div>
          );
        })}
      </div>
      {w.f >= resFrame - 2 && (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", transform: `scale(${interpolate(resSp, [0, 1], [1.1, 1])})` }}>
            <div style={{ position: "absolute", inset: -14, background: LIME, borderRadius: 18,
              clipPath: `inset(0 ${wipe}% 0 0)` }} />
            <div style={{ position: "relative", fontFamily: FONT,
              fontSize: fit(result, 60, 840), color: "#000", padding: "6px 10px" }}>{result}</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ══════════ 3. ЦЕПОЧКА СО СТРЕЛКОЙ — причинность ══════════ */
export const StepChain: React.FC<{ from: number; to: number; nodes: { text: string; color?: string }[] }> =
({ from, to, nodes }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const STEP = Math.round(0.55 * fps);   // такт: плашка → стрелка → плашка
  const GAP = 74;

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.6} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {nodes.map((n, i) => {
          const at = i * STEP * 2;
          const sp = spring({ frame: w.f - at, fps, config: springs.snappy });
          const color = n.color ?? (i === nodes.length - 1 ? LIME : i === 0 ? ORANGE : WARN);
          if (w.f < at - 1) return null;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg width={40} height={GAP} style={{ overflow: "visible" }}>
                  <DrawLine f={w.f} delay={at - STEP} frames={9} d={`M 20 4 L 20 ${GAP - 14}`}
                    length={GAP - 18} color={color} width={4} />
                  <polygon points={`20,${GAP - 2} 12,${GAP - 16} 28,${GAP - 16}`} fill={color}
                    opacity={interpolate(w.f - (at - STEP), [7, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
                </svg>
              )}
              <div style={{ opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [30, 0])}px)`,
                width: 900, background: "rgba(10,10,10,0.92)", border: `2px solid ${color}`,
                borderRadius: 20, padding: "20px 28px", boxShadow: `0 0 46px -20px ${color}` }}>
                <div style={{ fontFamily: FONT, fontSize: fit(n.text, 58, 760), color: "#fff", lineHeight: 1.14 }}>
                  {n.text}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 4. БЫЛО → СТАЛО — опровержение «не X, а Y» ══════════ */
export const StrikeReplace: React.FC<{ from: number; to: number; old: string; fresh: string }> =
({ from, to, old, fresh }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const strike = interpolate(w.f, [6, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const fade = interpolate(w.f, [14, 22], [1, 0.22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = spring({ frame: w.f - 16, fps, config: springs.snappy });
  const oldSize = fit(old, 56, 860);
  const oldW = measureText({ text: old, fontFamily: FONT, fontWeight: 800, fontSize: oldSize }).width;

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.6} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 26 }}>
        <div style={{ position: "relative", opacity: fade }}>
          <span style={{ fontFamily: FONT, fontSize: oldSize, color: "#8A8A8A" }}>{old}</span>
          <div style={{ position: "absolute", left: 0, top: "52%", height: 5, width: oldW * strike,
            background: ORANGE, borderRadius: 3 }} />
        </div>
        <div style={{ overflow: "hidden", clipPath: `inset(${(1 - rise) * 100}% 0 0 0)` }}>
          <div style={{ transform: `translateY(${interpolate(rise, [0, 1], [18, 0])}px)`,
            fontFamily: FONT, fontSize: fit(fresh, 68, 900), color: LIME }}>{fresh}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 5. ОДОМЕТР — масштаб цифры ══════════ */
export const Odometer: React.FC<{ from: number; to: number; value: number; prefix?: string; suffix?: string; caption?: string; accent?: string; posY?: number }> =
({ from, to, value, prefix = "", suffix = "", caption, accent = LIME, posY = 0.5 }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const roll = interpolate(w.f, [0, Math.round(0.7 * fps)], [0, value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: w.f, fps, config: springs.bouncy });
  const capIn = interpolate(w.f, [14, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: w.out, alignItems: "center", justifyContent: "flex-start", paddingTop: `${posY * 100}%` }}>
      <div style={{ position: "relative", transform: `scale(${interpolate(pop, [0, 1], [0.72, 1])})`,
        display: "flex", alignItems: "baseline", gap: 10 }}>
        <Ring f={w.f} from={200} to={520} color={accent} />
        {prefix && <span style={{ fontFamily: FONT, fontSize: 84, color: accent }}>{prefix}</span>}
        <span style={{ fontFamily: FONT, fontSize: 190, color: "#fff", fontVariantNumeric: "tabular-nums",
          textShadow: "0 6px 40px rgba(0,0,0,0.9)" }}>
          {Math.round(roll).toLocaleString("ru-RU")}
        </span>
        {suffix && <span style={{ fontFamily: FONT, fontSize: 84, color: accent }}>{suffix}</span>}
      </div>
      {caption && (
        <div style={{ opacity: capIn, transform: `translateY(${(1 - capIn) * 16}px)`, marginTop: 14,
          fontFamily: FONT, fontSize: 36, letterSpacing: 3, color: "rgba(255,255,255,0.72)",
          textShadow: "0 3px 18px #000" }}>{caption}</div>
      )}
    </AbsoluteFill>
  );
};

/* ══════════ 6. ЧЕК-ЛИСТ — инвентарь готового ══════════ */
export const Checklist: React.FC<{ from: number; to: number; items: string[]; title?: string; accent?: string }> =
({ from, to, items, title, accent = LIME }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const STEP = Math.round(0.5 * fps);

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.64} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18 }}>
        {title && <div style={{ fontFamily: FONT, fontSize: 34, letterSpacing: 5,
          color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{title}</div>}
        {items.map((t, i) => {
          const at = i * STEP;
          const sp = spring({ frame: w.f - at, fps, config: springs.snappy });
          const tick = interpolate(w.f - at - 6, [0, 7], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pulse = spring({ frame: w.f - at - 6, fps, config: { damping: 10, stiffness: 300, mass: 0.5 } });
          if (w.f < at - 1) return null;
          return (
            <div key={i} style={{ opacity: sp, width: 880,
              transform: `translateX(${interpolate(sp, [0, 1], [-70, 0])}px) scale(${1 + (1 - Math.abs(pulse - 0.5) * 2) * 0.02})`,
              display: "flex", alignItems: "center", gap: 20,
              background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 18, padding: "16px 24px" }}>
              <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
                <rect x="2" y="2" width="52" height="52" rx="14" fill="none" stroke={`${accent}66`} strokeWidth="2" />
                <polyline points="15,29 24,38 41,19" fill="none" stroke={accent} strokeWidth="6"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={44} strokeDashoffset={tick * 44} />
              </svg>
              <div style={{ fontFamily: FONT, fontSize: fit(t, 46, 740), color: "#fff", lineHeight: 1.14 }}>{t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 7. РАСКОЛ — сравнение двух состояний ══════════ */
export const SplitCompare: React.FC<{ from: number; to: number; before: { label: string; value: string }; after: { label: string; value: string } }> =
({ from, to, before, after }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const top = spring({ frame: w.f, fps, config: springs.snappy });
  const bot = spring({ frame: w.f - 10, fps, config: springs.snappy });
  const dim = interpolate(w.f - 12, [0, 10], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const Card: React.FC<{ p: number; label: string; value: string; color: string; dim?: number; dir: number }> =
    ({ p, label, value, color, dim = 1, dir }) => (
      <div style={{ opacity: p * dim, width: 860,
        transform: `translateY(${interpolate(p, [0, 1], [dir * 60, 0])}px)`,
        background: `${color}14`, border: `2px solid ${color}`, borderRadius: 24, padding: "22px 30px", textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 28, letterSpacing: 4, color: `${color}` }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: fit(value, 76, 780), color: "#fff", marginTop: 6 }}>{value}</div>
      </div>
    );

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.66} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Card p={top} label={before.label} value={before.value} color={ORANGE} dim={dim} dir={-1} />
        <svg width={40} height={64} style={{ overflow: "visible" }}>
          <DrawLine f={w.f} delay={8} frames={8} d="M 20 4 L 20 46" length={44} color={LIME} width={4} />
          <polygon points="20,60 11,44 29,44" fill={LIME}
            opacity={interpolate(w.f - 8, [7, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </svg>
        <Card p={bot} label={after.label} value={after.value} color={LIME} dir={1} />
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 8. ПРАВИЛО — вывод, эксклюзив на экране ══════════ */
export const Takeaway: React.FC<{ from: number; to: number; text: string; kicker?: string }> =
({ from, to, text, kicker = "ВЫВОД" }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const sp = spring({ frame: w.f, fps, config: springs.soft });
  const bar = interpolate(w.f, [8, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <Scrim w={w} to={0.82} rampFrames={8} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
        <div style={{ opacity: sp, fontFamily: FONT, fontSize: 30, letterSpacing: 6, color: LIME, marginBottom: 18 }}>
          {kicker}
        </div>
        <div style={{ height: 5, width: `${bar * 62}%`, background: LIME, borderRadius: 3, marginBottom: 26 }} />
        <div style={{ opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [26, 0])}px)`,
          fontFamily: FONT, fontSize: fitLines(text, 72, 900, 3), color: "#fff", textAlign: "center", lineHeight: 1.16,
          maxWidth: 900 }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 9. ПУЗЫРЬ — чужие слова, возражение ══════════ */
export const Bubble: React.FC<{ from: number; to: number; text: string; author?: string; side?: "left" | "right" }> =
({ from, to, text, author, side = "left" }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const sp = spring({ frame: w.f, fps, config: springs.bouncy });
  const chars = Math.floor(interpolate(w.f - 6, [0, text.length * 1.1], [0, text.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const authIn = interpolate(w.f - 6 - text.length * 1.1, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: side === "left" ? "flex-start" : "flex-end", justifyContent: "center", padding: "0 70px" }}>
        <div style={{ opacity: sp, transform: `scale(${interpolate(sp, [0, 1], [0.86, 1])})`,
          transformOrigin: side === "left" ? "left center" : "right center",
          maxWidth: 800, background: "#F2F2F2",
          borderRadius: 28, borderBottomLeftRadius: side === "left" ? 8 : 28,
          borderBottomRightRadius: side === "right" ? 8 : 28,
          padding: "22px 28px", boxShadow: "0 26px 60px -20px rgba(0,0,0,0.9)" }}>
          <div style={{ fontFamily: FONT, fontSize: 42, color: "#111", lineHeight: 1.22 }}>
            {text.slice(0, chars)}
          </div>
        </div>
        {author && (
          <div style={{ opacity: authIn, marginTop: 12, fontFamily: FONT, fontSize: 28,
            letterSpacing: 3, color: "rgba(255,255,255,0.75)", textShadow: "0 3px 14px #000" }}>{author}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ══════════ 10. ПЛАШКА — лёгкий фоновый приём (переехала из SecurityOverlay) ══════════ */
export const Plate: React.FC<{ from: number; to: number; step: string; text: string; accent?: string; side?: "left" | "right" }> =
({ from, to, step, text, accent = LIME, side = "left" }) => {
  const w = useWindow(from, to);
  if (!w) return null;
  const dir = side === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", [side]: 56, bottom: 470, opacity: w.out,
      transform: `translateX(${interpolate(w.inS, [0, 1], [dir * 640, 0])}px)`,
      filter: `blur(${interpolate(w.inS, [0, 1], [12, 0])}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 22, overflow: "hidden",
        background: "rgba(8,8,8,0.86)", border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: `0 26px 60px -20px #000, 0 0 44px -18px ${accent}` }}>
        <div style={{ width: 8, background: accent }} />
        <div style={{ padding: "20px 30px 22px 24px", maxWidth: 760 }}>
          <div style={{ fontFamily: FONT, fontSize: 22, letterSpacing: 3, color: accent, marginBottom: 8 }}>{step}</div>
          <div style={{ fontFamily: FONT, fontSize: fit(text, 48, 700), color: "#fff", lineHeight: 1.1 }}>{text}</div>
        </div>
      </div>
    </div>
  );
};
