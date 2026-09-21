import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ScribbleCircle } from "../../../kit/remocn/scribble-circle";
import { InkUnderline } from "../../../kit/remocn/ink-underline";
import { InkArrow } from "../../../kit/remocn/ink-arrow";
import { RGBGlitchText } from "../../../kit/remocn/rgb-glitch-text";
import { PerCharacterRise } from "../../../kit/remocn/per-character-rise";
import { MaskRevealUp } from "../../../kit/remocn/mask-reveal-up";
import { TrackingIn } from "../../../kit/remocn/tracking-in";
import { ShimmerSweep } from "../../../kit/remocn/shimmer-sweep";
import { MatrixDecode } from "../../../kit/remocn/matrix-decode";
import { SlotMachineRoll } from "../../../kit/remocn/slot-machine-roll";

const LIME = "#3DEDC3"; // лайм старого формата заменён мятным (палитра 18.09.2026)
const ORANGE = "#FC5C02";

/**
 * Акценты на ключевых моментах речи. Каждый момент — своя анимация,
 * иначе ролик читается однообразно.
 * `kind: "replace"` — вместо субтитра, `"decor"` — поверх него.
 */
export type Accent =
  | { at: number; dur: number; kind: "marker"; text: string }
  | { at: number; dur: number; kind: "glitch"; text: string }
  | { at: number; dur: number; kind: "number"; to: number; label: string }
  | { at: number; dur: number; kind: "scribble" }
  | { at: number; dur: number; kind: "underline" }
  | { at: number; dur: number; kind: "arrow" }
  | { at: number; dur: number; kind: "strike"; text: string }
  | { at: number; dur: number; kind: "steps"; items: string[]; untilSec: number }
  // варианты появления слова — чтобы субтитры не читались одним приёмом весь ролик
  | { at: number; dur: number; kind: "rise" | "mask" | "tracking" | "shimmer" | "matrix"; text: string }
  | { at: number; dur: number; kind: "slot"; from: string; text: string };

export const REPLACES = new Set(["marker", "glitch", "strike", "rise", "mask", "tracking", "shimmer", "matrix", "slot"]);

/** Слово, поверх которого не нужно рисовать обычный субтитр. */
export const isReplacedAt = (accents: Accent[], sec: number) =>
  accents.some((a) => REPLACES.has(a.kind) && sec >= a.at && sec < a.at + a.dur);

export const AccentFX: React.FC<{ accents: Accent[]; posY: number }> = ({ accents, posY }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {accents.map((a, i) => (
        <Sequence key={i} from={Math.round(a.at * fps)} durationInFrames={Math.round(a.dur * fps)}>
          <One a={a} posY={posY} />
        </Sequence>
      ))}
    </>
  );
};

const Centered: React.FC<{ top: string; children: React.ReactNode }> = ({ top, children }) => (
  <AbsoluteFill style={{ alignItems: "center" }}>
    <div style={{ position: "absolute", top, transform: "translateY(-50%)" }}>{children}</div>
  </AbsoluteFill>
);

const One: React.FC<{ a: Accent; posY: number }> = ({ a, posY }) => {
  const y = `${posY * 100}%`;
  switch (a.kind) {
    case "marker":
      return (
        <Centered top={y}>
          <Marker text={a.text} />
        </Centered>
      );
    case "glitch":
      return (
        <Centered top={y}>
          <RGBGlitchText text={a.text} fontSize={72} fontWeight={800} color="#fff" intensity={1.4} />
        </Centered>
      );
    case "number":
      return (
        <Centered top="17%">
          <BigNumber to={a.to} label={a.label} />
        </Centered>
      );
    case "scribble":
      return (
        <Centered top={y}>
          <ScribbleCircle width={620} height={190} color={ORANGE} strokeWidth={10} laps={2} />
        </Centered>
      );
    case "underline":
      return (
        <Centered top={`${posY * 100 + 4}%`}>
          <InkUnderline width={560} color={LIME} thickness={14} />
        </Centered>
      );
    case "rise":
      return <Centered top={y}><Txt><PerCharacterRise text={a.text} fontSize={60} fontWeight={800} color="#fff" /></Txt></Centered>;
    case "mask":
      return <Centered top={y}><Txt><MaskRevealUp text={a.text} fontSize={60} fontWeight={800} color="#fff" /></Txt></Centered>;
    case "tracking":
      return <Centered top={y}><Txt><TrackingIn text={a.text} fontSize={60} fontWeight={800} color="#fff" /></Txt></Centered>;
    case "shimmer":
      return <Centered top={y}><Txt><ShimmerSweep text={a.text} fontSize={60} fontWeight={800} baseColor="#fff" shineColor={LIME} /></Txt></Centered>;
    case "matrix":
      return <Centered top={y}><Txt><MatrixDecode text={a.text} fontSize={60} fontWeight={800} color={LIME} /></Txt></Centered>;
    case "slot":
      return <Centered top={y}><Txt><SlotMachineRoll from={a.from} to={a.text} fontSize={60} fontWeight={800} color="#fff" /></Txt></Centered>;
    case "strike":
      return (
        <Centered top={y}>
          <Strike text={a.text} />
        </Centered>
      );
    case "steps":
      return <Steps items={a.items} />;
    case "arrow":
      return (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: "12%", top: `${posY * 100 - 12}%` }}>
            <InkArrow from={{ x: 0, y: 0 }} to={{ x: 190, y: 130 }} color={LIME} strokeWidth={12} />
          </div>
        </AbsoluteFill>
      );
  }
};

/** Маркер: лаймовая полоса прочерчивается за словом, текст поверх неё. */
const Marker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = interpolate(frame, [0, fps * 0.35], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", padding: "6px 22px" }}>
      <div
        style={{
          position: "absolute", left: 0, top: "14%", height: "72%",
          width: `${w}%`, background: LIME, borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "relative", fontFamily: "Manrope", fontWeight: 800, fontSize: 60,
          color: w > 60 ? "#000" : "#fff", letterSpacing: "-0.01em", whiteSpace: "nowrap",
          WebkitTextStroke: w > 60 ? "0" : "6px #000", paintOrder: "stroke fill",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Крупная цифра со счётом вверх. Свой, а не из библиотеки — тот рассыпает разряды. */
const BigNumber: React.FC<{ to: number; label: string }> = ({ to, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.round(interpolate(frame, [0, fps * 0.7], [0, to], { extrapolateRight: "clamp" }));
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 200 } });
  return (
    <div style={{ textAlign: "center", transform: `scale(${0.75 + pop * 0.25})` }}>
      <div
        style={{
          fontFamily: "Manrope", fontWeight: 800, fontSize: 150, lineHeight: 1, color: LIME,
          fontVariantNumeric: "tabular-nums",
          WebkitTextStroke: "9px #000", paintOrder: "stroke fill",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "Manrope", fontWeight: 800, fontSize: 38, color: "#fff",
          letterSpacing: "0.06em", marginTop: 10,
          WebkitTextStroke: "6px #000", paintOrder: "stroke fill",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Зачёркивание — под «это НЕ вакансия»: слово гасится линией на глазах. */
const Strike: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = interpolate(frame, [fps * 0.25, fps * 0.6], [0, 100], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "relative", padding: "0 10px" }}>
      <div
        style={{
          fontFamily: "Manrope", fontWeight: 800, fontSize: 60, color: "#fff",
          letterSpacing: "-0.01em", whiteSpace: "nowrap",
          WebkitTextStroke: "6px #000", paintOrder: "stroke fill",
          opacity: interpolate(w, [0, 100], [1, 0.55]),
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: "52%", height: 9,
          background: ORANGE, borderRadius: 5,
          transform: `scaleX(${w / 100})`, transformOrigin: "left center",
          boxShadow: "0 0 0 3px rgba(0,0,0,.75)",
        }}
      />
    </div>
  );
};

/** Пронумерованные этапы — появляются по мере того, как о них говорят. */
const Steps: React.FC<{ items: string[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {items.map((t, i) => {
        const start = i * fps * 2.2;
        const p = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 170 } });
        if (frame < start) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 54, top: `${22 + i * 9}%`,
              display: "flex", alignItems: "center", gap: 18,
              opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 62, height: 62, borderRadius: 14, background: LIME,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Manrope", fontWeight: 800, fontSize: 36, color: "#000",
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontFamily: "Manrope", fontWeight: 800, fontSize: 44, color: "#fff",
                WebkitTextStroke: "6px #000", paintOrder: "stroke fill", whiteSpace: "nowrap",
              }}
            >
              {t}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Обёртка: шрифт и обводка как у обычных субтитров, иначе библиотечные компоненты выпадают из стиля. */
const Txt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: "Manrope",
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      WebkitTextStroke: "6px #000",
      paintOrder: "stroke fill",
      textShadow: "0 6px 20px rgba(0,0,0,.55)",
    }}
  >
    {children}
  </div>
);
