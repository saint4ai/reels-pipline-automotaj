import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Трёхъярусный монтаж — разобран покадрово у @pronin.media (12 роликов, ~285 кадров).
 *
 * Ключевое, что отличает его от остальных четырёх аккаунтов:
 *  · композиция не нарушена ни в одном кадре: визуал сверху, субтитр посередине, автор снизу
 *  · склеек ноль — он не режет, а наслаивает. Карточка появляется упрощённой и дорастает
 *  · субтитр 1–3 слова капсом, три уровня яркости внутри строки (караоке по индексу)
 *  · счётчик главы едет через весь ролик и НАКАПЛИВАЕТСЯ — неподвижный оверлей у него
 *    признак провальных роликов
 *
 * У Пронина нижний ярус — нарисованный персонаж. Здесь на его месте аватар Александра.
 */

const LIME = "#B6FF00";
export const ORANGE = "#FC5C02";
const RED = "#E5484D";
const GREEN = "#30A46C";
const INK = "#0A0A0A";
const PAPER = "#F4F4F6";

/* ── Каркас: три яруса ──────────────────────────────────────── */
export const ThreeTier: React.FC<{
  top: React.ReactNode;
  subtitle?: React.ReactNode;
  bottom: React.ReactNode;
  /** светлый фон как у Пронина или тёмный под бренд */
  paper?: boolean;
}> = ({ top, subtitle, bottom, paper = true }) => (
  <AbsoluteFill style={{ background: paper ? PAPER : INK }}>
    {/* перспективная сетка под нижним ярусом — у него во всех роликах */}
    <AbsoluteFill
      style={{
        top: "58%",
        backgroundImage: paper
          ? "linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)"
          : "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
        backgroundSize: "70px 70px",
      }}
    />
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "46%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 56px" }}>
      {top}
    </div>
    {subtitle && (
      <div style={{ position: "absolute", top: "47%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {subtitle}
      </div>
    )}
    <div style={{ position: "absolute", top: "56%", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {bottom}
    </div>
  </AbsoluteFill>
);

/* ── Субтитр: три уровня яркости в строке ───────────────────── */
export const KaraokeSub: React.FC<{
  /** слова строки; активное подсвечивается, прошедшие гаснут */
  words: string[];
  active: number;
  /** маркер под активным словом */
  marker?: "жёлтый" | "красный" | "нет";
  dark?: boolean;
}> = ({ words, active, marker = "жёлтый", dark = false }) => (
  <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap", justifyContent: "center", maxWidth: 960 }}>
    {words.map((w, i) => {
      const state = i < active ? "past" : i === active ? "now" : "next";
      const color =
        state === "now" ? (marker === "красный" ? RED : dark ? "#fff" : INK)
        : state === "past" ? (dark ? "#5A5A62" : "#A8A8B0")
        : "transparent";
      return (
        <span key={i} style={{ position: "relative", display: "inline-block" }}>
          {state === "now" && marker === "жёлтый" && (
            <span
              style={{
                position: "absolute", left: -8, right: -8, bottom: 4, height: "42%",
                background: LIME, borderRadius: 4, zIndex: 0,
              }}
            />
          )}
          <span
            style={{
              position: "relative", zIndex: 1,
              fontFamily: "Benzin", fontWeight: 800, fontSize: 58,
              textTransform: "uppercase", color, letterSpacing: "-0.01em",
            }}
          >
            {w}
          </span>
        </span>
      );
    })}
  </div>
);

/* ── Карточка, которая дорастает слоями ─────────────────────── */
export type Row = { text: string; badge?: string; tone?: "нейтр" | "плохо" | "хорошо" };

export const BuildCard: React.FC<{
  title: string;
  rows: Row[];
  /** кадров на появление одной строки */
  stagger?: number;
  icon?: string;
}> = ({ title, rows, stagger = 12, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });

  const toneColor = (t?: Row["tone"]) => (t === "плохо" ? RED : t === "хорошо" ? GREEN : "#8A8A93");

  return (
    <div
      style={{
        opacity: inP, transform: `translateY(${interpolate(inP, [0, 1], [26, 0])}px)`,
        background: "#fff", borderRadius: 22, padding: "26px 30px", minWidth: 760,
        boxShadow: "0 22px 60px rgba(0,0,0,.16)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: rows.length ? 20 : 0 }}>
        {icon && (
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Benzin", fontWeight: 800, fontSize: 22 }}>
            {icon}
          </div>
        )}
        <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 34, color: INK }}>{title}</div>
      </div>
      {rows.map((r, i) => {
        const p = spring({ frame: frame - (i + 1) * stagger, fps, config: { damping: 16, stiffness: 200 } });
        if (p <= 0.01) return null;
        return (
          <div
            key={i}
            style={{
              opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-16, 0])}px)`,
              display: "flex", alignItems: "center", gap: 14, padding: "11px 0",
              borderTop: i ? "1px solid #EEEEF2" : "none",
            }}
          >
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: toneColor(r.tone), flexShrink: 0 }} />
            <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 27, color: "#22222A", flex: 1 }}>{r.text}</div>
            {r.badge && (
              <div
                style={{
                  fontFamily: "Benzin", fontWeight: 800, fontSize: 20,
                  background: r.tone === "плохо" ? RED : r.tone === "хорошо" ? GREEN : INK,
                  color: "#fff", padding: "5px 13px", borderRadius: 999, whiteSpace: "nowrap",
                }}
              >
                {r.badge}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Счётчик главы: едет и накапливается ────────────────────── */
export const Chapter: React.FC<{ label: string; step: number; total: number }> = ({ label, step, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 14, stiffness: 240 } });
  return (
    <div
      style={{
        position: "absolute", top: 54, right: 46, zIndex: 20,
        transform: `scale(${0.9 + p * 0.1})`,
        background: INK, borderRadius: 999, padding: "12px 22px",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 24, color: "#fff" }}>{label}</span>
      <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 24, color: LIME, fontVariantNumeric: "tabular-nums" }}>
        {step}/{total}
      </span>
    </div>
  );
};

/* ── Аннотация поверх карточки: прочерк, обводка, стрелка ───── */
export const Annotate: React.FC<{
  kind: "перечеркнуть" | "обвести" | "стрелка";
  /** доли кадра: где рисовать */
  x: number; y: number; w?: number; h?: number;
  color?: string;
}> = ({ kind, x, y, w = 0.4, h = 0.08, color = RED }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, Math.min(durationInFrames, 18)], [0, 1], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const W = 1080, H = 1920;
  const X = x * W, Y = y * H, Wd = w * W, Hd = h * H;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 15 }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {kind === "перечеркнуть" && (
          <line x1={X} y1={Y} x2={X + Wd} y2={Y + Hd * 0.5} stroke={color} strokeWidth={9}
                strokeLinecap="round" strokeDasharray={Wd * 1.2} strokeDashoffset={Wd * 1.2 * (1 - p)} />
        )}
        {kind === "обвести" && (
          <ellipse cx={X + Wd / 2} cy={Y + Hd / 2} rx={Wd / 2} ry={Hd / 2}
                   fill="none" stroke={color} strokeWidth={8}
                   strokeDasharray={2 * Math.PI * (Wd / 2)} strokeDashoffset={2 * Math.PI * (Wd / 2) * (1 - p)} />
        )}
        {kind === "стрелка" && (
          <g opacity={p}>
            <line x1={X} y1={Y} x2={X} y2={Y + Hd * p} stroke={color} strokeWidth={9} strokeLinecap="round" />
            <polygon points={`${X - 16},${Y + Hd * p - 18} ${X + 16},${Y + Hd * p - 18} ${X},${Y + Hd * p + 8}`} fill={color} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ── Растущий ценник риска ──────────────────────────────────── */
export const RiskTag: React.FC<{ values: string[]; label?: string }> = ({ values, label = "ЦЕНА ОШИБКИ" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const per = durationInFrames / values.length;
  const i = Math.min(values.length - 1, Math.floor(frame / per));
  const bump = spring({ frame: frame - i * per, fps, config: { damping: 11, stiffness: 320 } });
  return (
    <div
      style={{
        position: "absolute", top: 54, left: 46, zIndex: 20,
        transform: `scale(${1 + bump * 0.08})`,
        background: RED, borderRadius: 999, padding: "12px 22px",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 19, color: "rgba(255,255,255,.75)" }}>{label}</span>
      <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 26, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
        {values[i]}
      </span>
    </div>
  );
};
