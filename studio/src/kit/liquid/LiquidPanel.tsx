import {Fragment, useId, useLayoutEffect, useMemo, useRef} from 'react';
import {getInputProps} from 'remotion';
import {elevation} from '../../ds/tokens';
import {useEnv} from './env';
import {lensMap} from './maps';

// Жидкое стекло с настоящим преломлением (Liquid Glass) для Remotion.
// Внутри панели лежит копия фона слоя (GlassEnv), шире панели на поле margin; на копию вешается обычный filter:
// размытие → линза по карте кромки (maps.ts) → насыщенность. Копия не зависит от фильтров и прозрачности предков,
// поэтому стекло не гаснет в переходах и при прозрачности самой панели (в отличие от backdrop-filter, O-1…O-3).
// Панель ставится в координатах слоя-среды (x, y — левый верхний угол) и не должна лежать внутри сдвинутых обёрток:
// иначе копия фона разъедется с настоящим.

export type GlassMaterial = 'clear' | 'frosted' | 'milk' | 'solid';
// Параметры в пикселях композиции 1440×2560 (профиль K1 × 4/3, подобрано на пробе LiquidProbe).
export const MAT: Record<GlassMaterial, {blur: number; sat: number; refract: number; rim: number; fill: number}> = {
  clear: {blur: 3, sat: 1.25, refract: 60, rim: 46, fill: 0.1},
  frosted: {blur: 16, sat: 1.18, refract: 44, rim: 38, fill: 0.4},
  milk: {blur: 22, sat: 1.1, refract: 34, rim: 34, fill: 0.62},
  solid: {blur: 22, sat: 1.1, refract: 24, rim: 30, fill: 0.92},
};

type Tone = 'dark' | 'light' | 'mint' | 'orange';
const TINT: Record<Tone, string> = {dark: '18,20,24', light: '250,251,252', mint: '61,237,195', orange: '255,122,47'};

export type LiquidProps = {
  x: number; y: number; w: number; h: number;
  r?: number | 'pill';
  material?: GlassMaterial;
  tone?: Tone;
  refract?: number; rim?: number; blur?: number; sat?: number; fill?: number;
  chroma?: number;       // хроматическая кромка: 0 — выкл, 0,1–0,2 — радужный край
  magnify?: number;      // лёгкое увеличение фона под стеклом, 1 — без увеличения
  sheen?: number;        // проход блика: 0…1 — положение полосы, undefined — нет
  moon?: number;         // лунный контровой свет справа сверху, 0…1
  level?: 1 | 2 | 3;     // высота: тень
  opacity?: number;
  lens?: boolean;        // false — без линзы (для сравнения на пробе)
  name?: string;         // имя для отчёта проверки [fit]
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const idOf = (raw: string) => 'lg' + raw.replace(/[^a-zA-Z0-9]/g, '');

// SVG-фильтр линзы для одной геометрии. chroma > 0 — три смещения по каналам и сборка через screen (приём K1).
// Размер карты — в пикселях (mw × mh — размер слоя с копией фона): проценты в feImage считаются от нулевого <svg>,
// карта становится пустой, и линза сдвигает всю панель целиком (проба LensVariants, 19.09.2026).
export const LensFilter: React.FC<{id: string; map: string; mw: number; mh: number; scale: number; chroma: number}> = ({id, map, mw, mh, scale, chroma}) => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={map} x={0} y={0} width={mw} height={mh} preserveAspectRatio="none" result="map" />
        {chroma > 0 ? (
          <>
            {[['1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 1 + chroma], ['0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 1], ['0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 1 - chroma]].map(([m, k], i) => (
              <Fragment key={i}>
                <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * Number(k)} xChannelSelector="R" yChannelSelector="G" result={`d${i}`} />
                <feColorMatrix in={`d${i}`} type="matrix" values={String(m)} result={`c${i}`} />
              </Fragment>
            ))}
            <feBlend in="c0" in2="c1" mode="screen" result="rg" />
            <feBlend in="rg" in2="c2" mode="screen" />
          </>
        ) : (
          <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        )}
      </filter>
    </defs>
  </svg>
);

// Поверхность стекла без фильтров: заливка, светящийся обод (свет слева сверху, отблеск справа снизу),
// блик сверху, внутренняя тень снизу, лунный контровой свет и бегущий блик.
export const GlassSurface: React.FC<{radius: number; tone: Tone; fill: number; sheen?: number; moon?: number}> = ({radius, tone, fill, sheen, moon = 0}) => {
  const light = tone === 'light';
  const rimA = light ? 0.95 : 0.85;
  const ring: React.CSSProperties = {position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none', padding: 2,
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'};
  return (
    <>
      <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius,
        background: `linear-gradient(180deg, rgba(255,255,255,${light ? 0.3 : 0.12}) 0%, rgba(255,255,255,0.02) 48%, rgba(255,255,255,0) 100%), rgba(${TINT[tone]},${fill})`}} />
      <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
        background: `radial-gradient(120% 80% at 16% -12%, rgba(255,255,255,${light ? 0.5 : 0.24}) 0%, rgba(255,255,255,0) 56%)`}} />
      <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
        boxShadow: `inset 0 -12px 26px rgba(0,0,0,${light ? 0.1 : 0.26}), inset 0 2px 0 rgba(255,255,255,${light ? 0.8 : 0.34})`}} />
      <span aria-hidden style={{...ring, background: `linear-gradient(135deg, rgba(255,255,255,${rimA}) 0%, rgba(255,255,255,.14) 30%, rgba(255,255,255,.05) 62%, rgba(255,255,255,.55) 100%)`}} />
      {moon > 0 ? (
        <span aria-hidden style={{...ring, padding: 3, opacity: moon,
          background: 'linear-gradient(225deg, rgba(214,255,245,1) 0%, rgba(160,245,225,.5) 18%, rgba(255,255,255,0) 42%)'}} />
      ) : null}
      {sheen !== undefined ? (
        <span aria-hidden style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none', mixBlendMode: 'screen',
          background: 'linear-gradient(108deg, transparent 32%, rgba(255,255,255,.5) 46%, rgba(255,255,255,.1) 52%, transparent 64%)',
          backgroundSize: '260% 100%', backgroundPosition: `${150 - sheen * 200}% 0`}} />
      ) : null}
    </>
  );
};

export const LiquidPanel: React.FC<LiquidProps> = (p) => {
  const env = useEnv();
  const m = MAT[p.material ?? 'frosted'];
  const tone = p.tone ?? 'dark';
  const {x, y, w, h} = p;
  const radius = p.r === 'pill' ? h / 2 : Math.min(p.r ?? 56, h / 2, w / 2);
  const blur = p.blur ?? m.blur, rim = p.rim ?? m.rim, refract = p.refract ?? m.refract;
  // Поле вокруг панели: кромка тянет фон снаружи на refract/2, размытие съедает ещё ~2 сигмы.
  const margin = Math.ceil(refract / 2 + blur * 2 + 8);
  const raw = useId();
  const id = idOf(raw);
  // Размеры округляются до 2 px: анимация ширины не плодит тысячу карт.
  const gw = Math.max(4, Math.round(w / 2) * 2), gh = Math.max(4, Math.round(h / 2) * 2);
  const map = useMemo(() => (env && p.lens !== false ? lensMap({w: gw, h: gh, r: Math.round(radius), rim, margin}) : ''), [env, gw, gh, radius, rim, margin, p.lens]);
  const filter = [blur ? `blur(${blur}px)` : '', map ? `url(#${id})` : '', `saturate(${p.sat ?? m.sat})`].filter(Boolean).join(' ');
  const k = p.magnify ?? 1;
  // Проверка содержимого после загрузки шрифтов: вылезло за стекло — ошибка [fit] (её собирает scripts/qa-fit.mjs).
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = content.current;
    if (!el || !el.childElementCount) return;
    const over = el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
    if (over) {
      console.error(`[fit] glass:${p.name ?? `${Math.round(x)},${Math.round(y)}`}: scroll ${el.scrollWidth}×${el.scrollHeight} client ${el.clientWidth}×${el.clientHeight}`);
      if ((getInputProps() as {qa?: boolean}).qa) el.style.outline = '6px solid #FF2D2D';
    }
  });
  return (
    <div data-glass={map ? 'refract' : 'flat'} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden',
      opacity: p.opacity ?? 1, boxShadow: elevation[p.level ?? 2], ...p.style}}>
      {map ? <LensFilter id={id} map={map} mw={w + margin * 2} mh={h + margin * 2} scale={refract} chroma={p.chroma ?? 0} /> : null}
      {env ? (
        <div style={{position: 'absolute', left: -margin, top: -margin, width: w + margin * 2, height: h + margin * 2, filter}}>
          <div style={{position: 'absolute', left: margin - x, top: margin - y, width: env.w, height: env.h,
            transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: `${x + w / 2}px ${y + h / 2}px`}}>
            {env.render()}
          </div>
        </div>
      ) : null}
      <GlassSurface radius={radius} tone={tone} fill={p.fill ?? m.fill} sheen={p.sheen} moon={p.moon} />
      <div ref={content} style={{position: 'absolute', inset: 0}}>{p.children}</div>
    </div>
  );
};
