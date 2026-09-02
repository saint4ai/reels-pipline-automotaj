import React from "react";
import {
  AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from "remotion";

export type EndCardProps = {
  title: string;
  subtitle: string;
  accent: string;
};

export const endCardDefaults: EndCardProps = {
  title: "СМОТРЕТЬ ПОДКАСТ",
  subtitle: "ССЫЛКА В ШАПКЕ ПРОФИЛЯ",
  accent: "#B6FF00",
};

/** Расходящееся кольцо — рождается в момент «удара» логотипа */
const Ring: React.FC<{ delay: number; accent: string }> = ({ delay, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - delay) / fps;
  if (t < 0) return null;
  const size = interpolate(t, [0, 1.4], [340, 1180], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const opacity = interpolate(t, [0, 0.15, 1.4], [0, 0.5, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      border: `2px solid ${accent}`, opacity,
      left: "50%", top: "44%", transform: "translate(-50%, -50%)",
    }} />
  );
};

export const EndCard: React.FC<EndCardProps> = ({ title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // логотип: влетает снизу, пружинит и слегка доворачивается
  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.9, stiffness: 110 } });
  const logoY = interpolate(enter, [0, 1], [260, 0]);
  const logoScale = interpolate(enter, [0, 1], [0.55, 1]);
  const tilt = interpolate(frame, [0, 40, 120], [-9, 0, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // дыхание свечения после приземления
  const breathe = 1 + Math.sin(Math.max(frame - 26, 0) / 13) * 0.045;
  const glow = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  // тексты: раскрытие маской снизу вверх
  const revealTitle = interpolate(frame, [34, 52], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: Easing.out(Easing.cubic) });
  const revealSub = interpolate(frame, [48, 66], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: Easing.out(Easing.cubic) });

  // линия-подчёркивание растёт от центра
  const lineW = interpolate(frame, [56, 78], [0, 340], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* холодное свечение в глубине кадра */}
      <AbsoluteFill style={{
        background: `radial-gradient(680px 680px at 50% 42%, ${accent}1f, transparent 68%)`,
        opacity: glow,
      }} />

      <Ring delay={24} accent={accent} />
      <Ring delay={40} accent={accent} />

      {/* логотип */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: height * 0.30 }}>
        <div style={{
          transform: `translateY(${logoY}px) scale(${logoScale * breathe}) rotateX(${tilt}deg)`,
          filter: `drop-shadow(0 26px 60px rgba(255,0,0,0.38)) drop-shadow(0 0 90px ${accent}22)`,
        }}>
          <Img src={staticFile("yt-logo.png")} style={{ width: 340 }} />
        </div>
      </AbsoluteFill>

      {/* тексты */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: height * 0.545 }}>
        <div style={{ overflow: "hidden", height: 84, width: "100%", padding: "0 70px", boxSizing: "border-box" }}>
          <div style={{
            transform: `translateY(${(1 - revealTitle) * 84}px)`,
            fontFamily: "Benzin-ExtraBold, Benzin, sans-serif",
            fontSize: 56, color: "#fff", letterSpacing: 3, lineHeight: "84px",
            textAlign: "center", whiteSpace: "nowrap",
          }}>{title}</div>
        </div>

        <div style={{ height: 3, width: lineW, background: accent, marginTop: 10, marginBottom: 22, borderRadius: 2 }} />

        <div style={{ overflow: "hidden", height: 54, width: "100%", padding: "0 70px", boxSizing: "border-box" }}>
          <div style={{
            transform: `translateY(${(1 - revealSub) * 54}px)`,
            fontFamily: "Benzin-ExtraBold, Benzin, sans-serif",
            fontSize: 30, color: accent, letterSpacing: 4, lineHeight: "54px",
            textAlign: "center", whiteSpace: "nowrap",
          }}>{subtitle}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
