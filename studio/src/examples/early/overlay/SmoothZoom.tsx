import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Медленный наезд с выдержкой и таким же медленным возвратом.
 * Не «панч»: короткие пружинные дёрганья по 0.5с утомляют глаз, если их много.
 * Точка зума привязана к лицу — иначе при 2x голова уезжает за кадр.
 */
export type ZoomSpec = {
  at: number;       // старт, сек
  to?: number;      // во сколько раз, по умолчанию 2
  hold?: number;    // сколько держать, сек
  ramp?: number;    // сколько заходить и возвращаться, сек
  originX?: number; // точка зума в долях кадра
  originY?: number;
};

/** Возвращает scale и transform-origin для текущего кадра. */
export const useSmoothZoom = (zooms: ZoomSpec[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  for (const z of zooms) {
    const to = z.to ?? 2;
    const ramp = z.ramp ?? 2.0; // 0.9с при 2x даёт рывок 58px/кадр — растянуто до ровных 26
    const hold = z.hold ?? 2;
    const end = z.at + ramp + hold + ramp;
    if (sec < z.at || sec > end) continue;

    // мягкая S-кривая на входе и выходе, без пружины и перелёта
    const scale = interpolate(
      sec,
      [z.at, z.at + ramp, z.at + ramp + hold, end],
      [1, to, to, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
    );
    return {
      scale,
      origin: `${(z.originX ?? 0.5) * 100}% ${(z.originY ?? 0.38) * 100}%`,
      active: true,
    };
  }
  return { scale: 1, origin: "50% 38%", active: false };
};
