import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const LIME = "#B6FF00";
const ORANGE = "#FC5C02";
const GREY = "#4A4A52";

/**
 * Графики из реальных замеров. Не иллюстрации, а данные —
 * поэтому засчитываются валидатором как proof-сцена наравне со скриншотом.
 *
 * Разбор показал, что в нише на 37 роликов пришлась одна диаграмма.
 * То есть это свободная полоса: показывать числами почти никто не умеет.
 */

/* ── Сравнение двух величин столбиками ─────────────────────── */
export const BarCompare: React.FC<{
  title: string;
  left: { label: string; value: number; color?: string };
  right: { label: string; value: number; color?: string };
  unit?: string;
}> = ({ title, left, right, unit = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const max = Math.max(left.value, right.value);

  const Bar = ({ d, side }: { d: typeof left; side: number }) => {
    const h = (d.value / max) * 620 * grow;
    const shown = (d.value * grow).toFixed(d.value % 1 ? 1 : 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div
          style={{
            fontFamily: "Benzin", fontWeight: 800, fontSize: 78,
            color: d.color ?? (side === 0 ? LIME : GREY),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shown}{unit}
        </div>
        <div
          style={{
            width: 210, height: h, borderRadius: "18px 18px 0 0",
            background: d.color ?? (side === 0 ? LIME : GREY),
            boxShadow: "0 -8px 40px rgba(0,0,0,.4)",
          }}
        />
        <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 34, color: "#fff", textAlign: "center", maxWidth: 260 }}>
          {d.label}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#0A0A0A", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
      <div
        style={{
          fontFamily: "Benzin", fontWeight: 800, fontSize: 50, color: "#fff",
          marginBottom: 70, textAlign: "center", opacity: interpolate(grow, [0, 0.4], [0, 1]),
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: 110, alignItems: "flex-end" }}>
        <Bar d={left} side={0} />
        <Bar d={right} side={1} />
      </div>
    </AbsoluteFill>
  );
};

/* ── Ломаная по кварталам ───────────────────────────────────── */
export const Trajectory: React.FC<{
  title: string;
  points: { label: string; value: number }[];
  color?: string;
}> = ({ title, points, color = ORANGE }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames * 0.75], [0, 1], { extrapolateRight: "clamp" });

  const W = 880, H = 520;
  const max = Math.max(...points.map((x) => x.value));
  const xy = points.map((d, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - (d.value / max) * H,
    ...d,
  }));
  const path = xy.map((q, i) => `${i === 0 ? "M" : "L"} ${q.x} ${q.y}`).join(" ");
  const shown = Math.floor(p * (points.length - 1));

  return (
    <AbsoluteFill style={{ background: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 46, color: "#fff", marginBottom: 50 }}>
        {title}
      </div>
      <svg width={W + 120} height={H + 120} style={{ overflow: "visible" }}>
        <g transform="translate(60,40)">
          <path
            d={path} fill="none" stroke={color} strokeWidth={9}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={3000} strokeDashoffset={3000 * (1 - p)}
          />
          {xy.map((q, i) => {
            const on = i <= shown;
            const pop = spring({ frame: frame - i * (durationInFrames * 0.75 / points.length), fps, config: { damping: 12, stiffness: 260 } });
            return (
              <g key={i} opacity={on ? 1 : 0}>
                <circle cx={q.x} cy={q.y} r={13 * (on ? pop : 0)} fill={color} stroke="#0A0A0A" strokeWidth={5} />
                <text
                  x={q.x} y={q.y - 34} textAnchor="middle"
                  style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 34, fill: "#fff" }}
                >
                  {(q.value / 1000).toFixed(q.value >= 10000 ? 0 : 1)}k
                </text>
                <text
                  x={q.x} y={H + 46} textAnchor="middle"
                  style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 26, fill: "#8A8A8F" }}
                >
                  {q.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ── Ценник: во сколько раз дороже ──────────────────────────── */
export const PriceGap: React.FC<{
  cheap: { label: string; price: string };
  costly: { label: string; price: string };
  times: number;
}> = ({ cheap, costly, times }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const b = spring({ frame: frame - fps * 0.5, fps, config: { damping: 16, stiffness: 140 } });
  const c = spring({ frame: frame - fps * 1.1, fps, config: { damping: 14, stiffness: 200 } });

  const Card = ({ d, accent, op }: { d: typeof cheap; accent: string; op: number }) => (
    <div
      style={{
        opacity: op, transform: `translateY(${interpolate(op, [0, 1], [30, 0])}px)`,
        background: "#141418", border: `3px solid ${accent}`, borderRadius: 26,
        padding: "30px 46px", minWidth: 620, textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 32, color: "#8A8A8F", marginBottom: 12 }}>
        {d.label}
      </div>
      <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 92, color: accent, fontVariantNumeric: "tabular-nums" }}>
        {d.price}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: "#0A0A0A", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <Card d={cheap} accent={LIME} op={a} />
      <Card d={costly} accent={ORANGE} op={b} />
      <div
        style={{
          opacity: c, transform: `scale(${0.7 + c * 0.3})`,
          fontFamily: "Benzin", fontWeight: 800, fontSize: 68, color: "#fff", marginTop: 14,
        }}
      >
        в {times} раз дороже
      </div>
    </AbsoluteFill>
  );
};
