import {Easing, Img, interpolate, staticFile} from 'remotion';

// Сгенерированный стеклянный предмет (public/objects/*.png) как 2,5D-объект: вход с пружинкой, парение, лёгкий наклон,
// мягкая тень на «полу», проход блика и лунный контровой свет строго по силуэту (маска — альфа самой картинки).
// Размер не больше 1,3× исходных 1024 px, чтобы не мылить.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

export type ObjectProps = {
  src: string; x: number; y: number; size: number; t: number;
  at?: number;          // секунда входа (появление из размытия с пружинкой)
  out?: number;         // секунда ухода
  float?: number;       // амплитуда парения, px
  tilt?: number;        // покачивание, градусы
  sheenAt?: number;     // секунда прохода блика
  moon?: number;        // сила холодного контрового света справа сверху
  shadow?: boolean;
  scale?: number;       // дополнительный масштаб (для «удара» по слову)
  opacity?: number;
  style?: React.CSSProperties;
};

export const Object25D: React.FC<ObjectProps> = (p) => {
  const {t, size} = p;
  const at = p.at ?? -10;
  const k = interpolate(t, [at, at + 0.55], [0, 1], {...clamp, easing: pop});
  const vis = interpolate(t, [at, at + 0.25], [0, 1], clamp) * (p.out !== undefined ? interpolate(t, [p.out, p.out + 0.3], [1, 0], clamp) : 1);
  if (vis <= 0) return null;
  const fl = (p.float ?? 14) * Math.sin((t - at) * 1.6);
  const rot = (p.tilt ?? 4) * Math.sin((t - at) * 1.1 + 0.6);
  const s = (0.55 + 0.45 * k) * (p.scale ?? 1);
  const url = staticFile(p.src);
  const mask: React.CSSProperties = {WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'};
  const sheen = p.sheenAt !== undefined ? interpolate(t, [p.sheenAt, p.sheenAt + 0.8], [0, 1], clamp) : -1;
  return (
    <div style={{position: 'absolute', left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, opacity: vis * (p.opacity ?? 1), ...p.style}}>
      {p.shadow !== false ? (
        <div style={{position: 'absolute', left: size * 0.2, top: size * 0.86, width: size * 0.6, height: size * 0.1, borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,.55), rgba(0,0,0,0))', transform: `scale(${1 - fl / 160})`, filter: 'blur(6px)'}} />
      ) : null}
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${fl}px) rotate(${rot}deg) scale(${s})`, filter: k < 1 ? `blur(${(1 - Math.min(1, k)) * 14}px)` : undefined}}>
        <Img src={url} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
        {sheen >= 0 && sheen < 1 ? (
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen',
            background: `linear-gradient(110deg, rgba(255,255,255,0) ${sheen * 140 - 40}%, rgba(255,255,255,.75) ${sheen * 140 - 22}%, rgba(255,255,255,0) ${sheen * 140}%)`}} />
        ) : null}
        {p.moon ? (
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen', opacity: p.moon,
            background: 'radial-gradient(70% 70% at 88% 12%, rgba(214,255,245,.7) 0%, rgba(214,255,245,0) 60%)'}} />
        ) : null}
      </div>
    </div>
  );
};
