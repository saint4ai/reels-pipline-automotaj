import React from "react";
import {
  AbsoluteFill,
  Series,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import data from "../public/teaser/data.json";

export type TeaserProps = {
  subFontSize: number;
  subPosY: number;
  headFontSize: number;
  headPosY: number;
  limeColor: string;
  orangeColor: string;
  subBgOpacity: number;
  showEndCard: boolean;
};

export const teaserDefaults: TeaserProps = {
  subFontSize: 76,
  subPosY: 1430,
  headFontSize: 52,
  headPosY: 330,
  limeColor: "#B6FF00",
  orangeColor: "#FC5C02",
  subBgOpacity: 0.55,
  showEndCard: true,
};

const Word: React.FC<{ w: any; p: TeaserProps }> = ({ w, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const born = frame - w.from * fps;
  const pop = spring({ frame: born, fps, config: { damping: 14, mass: 0.4 } });
  const scale = interpolate(pop, [0, 1], [w.color ? 0.6 : 0.85, 1]);
  const color =
    w.color === "orange"
      ? p.orangeColor
      : w.color === "lime"
        ? p.limeColor
        : "#FFFFFF";
  return (
    <div
      style={{
        position: "absolute",
        top: p.subPosY,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          fontFamily: "Soyuz Grotesk, Benzin, sans-serif",
          fontSize: p.subFontSize,
          color,
          background: `rgba(48,48,48,${p.subBgOpacity})`,
          padding: "10px 26px",
          letterSpacing: 1,
          WebkitTextStroke: "5px rgba(0,0,0,0.9)",
          paintOrder: "stroke fill",
        }}
      >
        {w.text}
      </span>
    </div>
  );
};

const Clip: React.FC<{ clip: any; p: TeaserProps }> = ({ clip, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = clip.words.filter((w: any) => t >= w.from && t < w.to);
  const headIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile(clip.src)} />
      <div
        style={{
          position: "absolute",
          top: p.headPosY,
          left: 90,
          right: 90,
          textAlign: "center",
          opacity: headIn,
          fontFamily: "Benzin-ExtraBold, Benzin, sans-serif",
          fontSize: p.headFontSize,
          letterSpacing: 3,
          color: clip.trigger ? p.limeColor : "#FFFFFF",
          WebkitTextStroke: "4px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
        }}
      >
        {clip.head}
      </div>
      {active.map((w: any, i: number) => (
        <Word key={i} w={w} p={p} />
      ))}
    </AbsoluteFill>
  );
};

export const Teaser: React.FC<TeaserProps> = (p) => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Series>
      {data.clips.map((c: any, i: number) => (
        <Series.Sequence key={i} durationInFrames={Math.round(c.duration * 30)}>
          <Clip clip={c} p={p} />
        </Series.Sequence>
      ))}
      {p.showEndCard && (
        <Series.Sequence durationInFrames={90}>
          <OffthreadVideo src={staticFile(data.endCard)} />
        </Series.Sequence>
      )}
    </Series>
  </AbsoluteFill>
);

export const TEASER_FRAMES =
  Math.round(data.clips.reduce((s: number, c: any) => s + c.duration, 0) * 30) +
  90;
