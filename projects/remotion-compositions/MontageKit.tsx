import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HOOK_MAX_SEC, HOOK_MIN_SIZE_RATIO, type ProofNumberKind } from "./rules";

const LIME = "#B6FF00";
const ORANGE = "#FC5C02";
const INK = "#0A0A0A";

/**
 * Набор под правила из rules.ts. Каждый компонент закрывает конкретный
 * измеренный признак залетевших роликов — что именно, написано над ним.
 */

/* ─────────────────────────────────────────────────────────────
 * ДОКАЗАТЕЛЬСТВО
 * Самый устойчивый признак разбора: реальный артефакт вместо нарисованного
 * макета. Сработал у 4 аккаунтов из 5. У aikirichenko — 8 из 8 залетевших
 * сняты с экрана, 0 из 8 провальных.
 *
 * Компонент намеренно принимает только путь к файлу: подсунуть сюда
 * свёрстанную карточку и выдать её за скриншот нельзя.
 * ───────────────────────────────────────────────────────────── */
export const ProofShot: React.FC<{
  src: string;
  /** лёгкий наезд, чтобы статичный скриншот не выглядел замершим */
  zoom?: number;
  originY?: number;
}> = ({ src, zoom = 1.08, originY = 0.4 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, zoom], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${scale})`, transformOrigin: `50% ${originY * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ─────────────────────────────────────────────────────────────
 * КРУПНАЯ ЦИФРА
 * Пруф должен читаться, не полагаясь на исходник: счётчик звёзд в оригинале
 * мелкий, зритель его не разберёт. Дублируем поверх.
 *
 * Приоритет из разбора: деньги зрителя > чужая метрика > свои шаги.
 * У pronin.media в залетевших «1–6 млн ₽ штраф», в провальных «3.4% выжило».
 * Собственная нумерация шагов — почти всегда признак провального ролика,
 * поэтому она красится приглушённо, а не акцентом.
 * ───────────────────────────────────────────────────────────── */
const NUMBER_COLOR: Record<ProofNumberKind, string> = {
  "деньги зрителя": ORANGE,
  "чужая метрика": LIME,
  "свои шаги": "#8A8A8F",
};

export const BigNumber: React.FC<{
  value: string;
  kind?: ProofNumberKind;
  label?: string;
  posY?: number;
}> = ({ value, kind = "чужая метрика", label, posY = 0.24 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 200, mass: 0.7 } });
  const color = NUMBER_COLOR[kind];

  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", top: `${posY * 100}%`,
          transform: `translateY(-50%) scale(${0.8 + pop * 0.2})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Benzin", fontWeight: 800,
            // кегль не меньше 1/10 высоты кадра — иначе цифра не работает как пруф
            fontSize: 190, lineHeight: 0.92, color,
            WebkitTextStroke: "8px #000", paintOrder: "stroke fill",
            textShadow: "0 8px 32px rgba(0,0,0,.55)",
            letterSpacing: "-0.02em", whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        {label && (
          <div
            style={{
              fontFamily: "Benzin", fontWeight: 800, fontSize: 44,
              color: "#fff", marginTop: 10, letterSpacing: "0.04em",
              WebkitTextStroke: "5px #000", paintOrder: "stroke fill",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────────────────────────────────────────────────────────
 * ХУК-КАРТОЧКА
 * У mike.mozg разделение чистое: 8 из 8 залетевших открываются крупным
 * текстовым заголовком, 0 из 8 провальных.
 *
 * Живёт первые 1–1.5 сек и уходит — не остаётся на весь ролик, иначе
 * превращается в неподвижный оверлей, который правила запрещают.
 * ───────────────────────────────────────────────────────────── */
export const HookCard: React.FC<{
  text: string;
  /** кегль субтитра, от которого считается минимальный размер */
  subtitleSize?: number;
  accent?: string;
}> = ({ text, subtitleSize = 52, accent = LIME }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const life = HOOK_MAX_SEC * fps;

  const inP = spring({ frame, fps, config: { damping: 16, stiffness: 220 } });
  const out = interpolate(frame, [life - fps * 0.25, life], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (frame > life) return null;

  const words = text.trim().split(/\s+/);

  return (
    <AbsoluteFill style={{ padding: "0 70px", justifyContent: "flex-start", pointerEvents: "none" }}>
      <div
        style={{
          marginTop: 190, opacity: inP * out,
          transform: `translateY(${interpolate(inP, [0, 1], [-26, 0])}px)`,
          background: INK, borderRadius: 26, padding: "30px 38px",
          boxShadow: "0 26px 70px rgba(0,0,0,.6)",
          display: "flex", flexWrap: "wrap", gap: "10px 16px",
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: "Benzin", fontWeight: 800,
              // правило: кегль от 2.5× субтитра
              fontSize: subtitleSize * HOOK_MIN_SIZE_RATIO,
              lineHeight: 1.02, textTransform: "uppercase",
              color: i === words.length - 1 ? accent : "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────────────────────────────────────────────────────────
 * СЧЁТЧИК
 * Единственный сквозной элемент, который разрешён правилами.
 *
 * Контринтуитивный вывод разбора: неподвижная плашка — рамка вокруг лица,
 * водяной знак, «REC», таймкод — оказалась признаком ПРОВАЛЬНЫХ роликов
 * у aikirichenko, при том что выглядит дороже. А растущий ценник у
 * pronin.media и заполняющаяся сетка у buhaistrikalo — признак залетевших.
 *
 * Отсюда правило: сквозной элемент оправдан, только если он накапливается.
 * ───────────────────────────────────────────────────────────── */
export const Counter: React.FC<{
  /** последовательность значений: показываются по ходу ролика */
  steps: string[];
  label?: string;
  posY?: number;
  accent?: string;
}> = ({ steps, label, posY = 0.09, accent = ORANGE }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  if (steps.length === 0) return null;

  const per = durationInFrames / steps.length;
  const idx = Math.min(steps.length - 1, Math.floor(frame / per));
  const local = frame - idx * per;
  const bump = spring({ frame: local, fps, config: { damping: 12, stiffness: 300 } });

  return (
    <AbsoluteFill style={{ alignItems: "flex-end", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", top: `${posY * 100}%`, right: 56,
          transform: `scale(${1 + bump * 0.06})`,
          background: INK, border: `3px solid ${accent}`,
          borderRadius: 999, padding: "14px 26px",
          display: "flex", alignItems: "baseline", gap: 12,
          boxShadow: "0 12px 34px rgba(0,0,0,.5)",
        }}
      >
        {label && (
          <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 24, color: "#9a9aa2" }}>
            {label}
          </span>
        )}
        <span style={{ fontFamily: "Benzin", fontWeight: 800, fontSize: 40, color: accent, fontVariantNumeric: "tabular-nums" }}>
          {steps[idx]}
        </span>
      </div>
    </AbsoluteFill>
  );
};
