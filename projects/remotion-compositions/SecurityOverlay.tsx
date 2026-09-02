import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

const FONT = "Benzin-ExtraBold, Benzin, sans-serif";
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

/* ── помощник: пружинный вход/выход по окну времени ── */
const useWindow = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - from * fps;
  const life = (to - from) * fps;
  if (f < -1 || f > life + 18) return null;
  const inS = spring({ frame: f, fps, config: { damping: 15, mass: 0.7, stiffness: 120 } });
  const out = interpolate(f, [life - 10, life + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { f, inS, out, life };
};

/* ── 1. ПЛАШКА СНИЗУ: стеклянная карточка с цветной полосой ── */
const Plate: React.FC<{ from: number; to: number; step: string; text: string; accent: string; side?: "left" | "right" }> =
({ from, to, step, text, accent, side = "left" }) => {
  const w = useWindow(from, to);
  if (!w) return null;
  const dir = side === "left" ? -1 : 1;
  const x = interpolate(w.inS, [0, 1], [dir * 640, 0]);
  const blur = interpolate(w.inS, [0, 1], [12, 0]);
  return (
    <div style={{ position: "absolute", [side]: 56, bottom: 470, opacity: w.out,
      transform: `translateX(${x}px)`, filter: `blur(${blur}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 22, overflow: "hidden",
        background: "rgba(8,8,8,0.82)", backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.12)", boxShadow: `0 26px 60px -20px #000, 0 0 44px -18px ${accent}` }}>
        <div style={{ width: 8, background: accent }} />
        <div style={{ padding: "20px 30px 22px 24px", maxWidth: 720 }}>
          <div style={{ fontFamily: FONT, fontSize: 20, letterSpacing: 3, color: accent, marginBottom: 8 }}>{step}</div>
          <div style={{ fontFamily: FONT, fontSize: 46, color: "#fff", lineHeight: 1.1 }}>{text}</div>
        </div>
      </div>
    </div>
  );
};

/* ── 2. БЕЙДЖ «ОДИН РАЗ» — крупная цифра с пульсом ── */
const OnceBadge: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const w = useWindow(from, to);
  if (!w) return null;
  const pop = interpolate(w.inS, [0, 1], [0.5, 1]);
  const pulse = 1 + Math.sin(w.f / 7) * 0.03;
  const ring = interpolate(w.f, [0, 26], [120, 300], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ringO = interpolate(w.f, [0, 8, 30], [0, 0.55, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right: 70, top: 980, opacity: w.out,
      transform: `scale(${pop * pulse})`, transformOrigin: "center" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: ring, height: ring,
        marginLeft: -ring / 2, marginTop: -ring / 2, borderRadius: "50%",
        border: `2px solid ${ORANGE}`, opacity: ringO }} />
      <div style={{ position: "relative", background: ORANGE, borderRadius: 20, padding: "16px 26px",
        boxShadow: `0 0 60px -12px ${ORANGE}` }}>
        <div style={{ fontFamily: FONT, fontSize: 76, color: "#000", lineHeight: 0.9 }}>1</div>
        <div style={{ fontFamily: FONT, fontSize: 22, color: "#000", letterSpacing: 2 }}>РАЗ</div>
      </div>
    </div>
  );
};


/* ── КОД → НАВЫК: карточка кода схлопывается в значок ── */
const CodeToSkill: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const t = w.f / fps;
  const collapse = interpolate(t, [0.85, 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const codeScale = interpolate(collapse, [0, 1], [1, 0.12]);
  const codeOp = interpolate(collapse, [0, 0.75], [1, 0], { extrapolateRight: "clamp" });
  const spin = interpolate(collapse, [0, 1], [0, 190]);
  const badge = spring({ frame: w.f - Math.round(1.42 * fps), fps, config: { damping: 11, mass: 0.6 } });
  const ring = interpolate(w.f - 1.42 * fps, [0, 22], [90, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ringO = interpolate(w.f - 1.42 * fps, [0, 7, 26], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const LINES = [200, 150, 230, 120, 190, 165];
  return (
    <div style={{ position: "absolute", right: 74, bottom: 720, display: "flex",
      flexDirection: "column-reverse", alignItems: "center", opacity: w.out }}>
      <div style={{ position: "relative", width: 300, height: 230, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        {/* карточка кода */}
        <div style={{ position: "absolute", opacity: codeOp,
          transform: `scale(${codeScale}) rotate(${spin}deg)`,
          background: "rgba(10,10,10,0.92)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 18, padding: 26, width: 330,
          boxShadow: "0 24px 60px -24px #000" }}>
          {LINES.map((wd, i) => (
            <div key={i} style={{ height: 10, width: wd, borderRadius: 5, marginBottom: 11,
              background: i % 3 === 0 ? LIME : "rgba(255,255,255,0.3)" }} />
          ))}
        </div>
        {/* значок навыка */}
        <div style={{ position: "absolute", opacity: badge,
          transform: `scale(${interpolate(badge, [0, 1], [0.4, 1])})` }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: ring, height: ring,
            marginLeft: -ring / 2, marginTop: -ring / 2, borderRadius: "50%",
            border: `2px solid ${LIME}`, opacity: ringO }} />
          <div style={{ width: 168, height: 168, borderRadius: 40, background: LIME,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 70px -10px ${LIME}` }}>
            <svg width="86" height="86" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6l-8-4z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ opacity: badge, transform: `translateY(${interpolate(badge, [0, 1], [16, 0])}px)`,
        fontFamily: FONT, fontSize: 40, color: "#fff", letterSpacing: 3, marginBottom: 18,
        textShadow: "0 3px 14px #000" }}>
        НАВЫК АГЕНТА
      </div>
    </div>
  );
};

/* ── 3. ФИНАЛЬНАЯ СХЕМА: затемнение + цепочка шагов ── */
const STEPS = [
  { t: "Платформа была\nуязвима", c: "#FF4D3D" },
  { t: "Нанял\nбезопасника", c: "#FFB020" },
  { t: "Забрал его\nправки", c: LIME },
  { t: "Агент делает\nэто сам", c: LIME },
];
const Chain: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const w = useWindow(from, to);
  const { fps } = useVideoConfig();
  if (!w) return null;
  const dim = interpolate(w.f, [0, 14], [0, 0.82], { extrapolateRight: "clamp" }) * w.out;
  return (
    <AbsoluteFill style={{ opacity: w.out }}>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 430, display: "flex",
        flexDirection: "column", alignItems: "center", gap: 18 }}>
        {STEPS.map((s, i) => {
          const sp = spring({ frame: w.f - 6 - i * 9, fps, config: { damping: 14, mass: 0.6 } });
          const done = i < 3;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ width: 3, height: interpolate(sp, [0, 1], [0, 34]),
                  background: `linear-gradient(${STEPS[i - 1].c}, ${s.c})`, opacity: sp }} />
              )}
              <div style={{ opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [40, 0])}px) scale(${interpolate(sp, [0, 1], [0.9, 1])})`,
                display: "flex", alignItems: "center", gap: 18, width: 800,
                background: "rgba(12,12,12,0.9)", border: `1px solid ${s.c}55`, borderRadius: 20,
                padding: "18px 26px", boxShadow: `0 0 50px -22px ${s.c}` }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: s.c, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT, fontSize: 26, color: "#000" }}>{done ? "✓" : "★"}</div>
                <div style={{ fontFamily: FONT, fontSize: 38, color: "#fff", lineHeight: 1.12, whiteSpace: "pre-line" }}>{s.t}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ── СБОРКА: тайминги привязаны к словам речи ── */
export const SecurityOverlay: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <Plate from={3.6} to={5.9}  step="ПРОБЛЕМА" text="Платформа была уязвима" accent="#FF4D3D" side="left" />
    <Plate from={10.6} to={15.6} step="ШАГ 1" text="Нанял безопасника" accent="#FFB020" side="right" />
    <OnceBadge from={17.8} to={20.2} />
    <Plate from={20.5} to={24.3} step="ШАГ 2" text="Забрал его правки агентом" accent={LIME} side="left" />
    <CodeToSkill from={24.2} to={27.4} />
    <Chain from={27.0} to={30.8} />
  </AbsoluteFill>
);
