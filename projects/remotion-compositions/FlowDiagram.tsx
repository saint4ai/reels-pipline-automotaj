import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

/**
 * Схема процесса, нарисованная из слов спикера.
 * Проходит гейт мотивированности: тип связи — «уточнение», добавляет структуру,
 * которой в речи нет. Ничего внешнего, никаких метафор — промахнуться нечем.
 * Всё завязано на useCurrentFrame: библиотеки со своими часами в Remotion
 * доигрывают анимацию в первую секунду рендера и дальше дают пустой кадр.
 */
export type Step = { label: string; sub?: string; accent?: boolean };

export const FlowDiagram: React.FC<{ steps: Step[]; title?: string }> = ({ steps, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      {title && (
        <div
          style={{
            fontFamily: "Benzin", fontWeight: 800, fontSize: 40, color: "#fff",
            marginBottom: 54, letterSpacing: "0.02em", opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
            WebkitTextStroke: "6px #000", paintOrder: "stroke fill",
          }}
        >
          {title}
        </div>
      )}

      {steps.map((s, i) => {
        const start = fps * (0.35 + i * 0.75);
        const p = interpolate(frame - start, [0, fps * 0.45], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.4)),
        });
        // соединитель прочерчивается ПОСЛЕ появления предыдущего блока
        const lineP = i === 0 ? 0 : interpolate(frame - (start - fps * 0.3), [0, fps * 0.3], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {i > 0 && (
              <svg width="8" height="70" style={{ overflow: "visible" }}>
                <line
                  x1="4" y1="0" x2="4" y2="70"
                  stroke={LIME} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="70" strokeDashoffset={70 * (1 - lineP)}
                />
              </svg>
            )}
            <div
              style={{
                opacity: p,
                transform: `scale(${0.8 + p * 0.2})`,
                display: "flex", alignItems: "center", gap: 24,
                background: "rgba(0,0,0,.78)",
                border: `3px solid ${s.accent ? ORANGE : LIME}`,
                borderRadius: 22, padding: "22px 34px", minWidth: 620,
                boxShadow: "0 20px 50px rgba(0,0,0,.55)",
              }}
            >
              <div
                style={{
                  width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                  background: s.accent ? ORANGE : LIME,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Benzin", fontWeight: 800, fontSize: 36, color: "#000",
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 44, color: "#fff", lineHeight: 1.05 }}>
                  {s.label}
                </div>
                {s.sub && (
                  <div style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 24, color: "#9a9aa2", marginTop: 6 }}>
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
