import {AbsoluteFill, Easing, interpolate} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {H, W} from '../theme';

// Переходы режима «сцены» для TransitionSeries. Каждый снят с референса по кадрам (30 fps):
// portal 2,0–2,3 с · blurThrough 5,8–6,1 и 29,0–29,3 · bloom 9,9–10,3 · whip 12,5–12,8 · lift 39,2–39,5.
// Оговорка: фильтр и clip-path на сцене ломают размытие стекла внутри неё, пока идёт переход.
// Поэтому входящая сцена первые ~0,3 с начинается с заголовка, а стеклянные панели выходят позже.

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inn = Easing.bezier(0.7, 0, 0.84, 0);
type P<T extends Record<string, unknown>> = TransitionPresentationComponentProps<T>;

// Размытие сквозь цвет: уходящая сцена плывёт вверх и мутнеет, кадр заливается цветом следующего фона,
// новая сцена проявляется из размытия. Референс: небо → чёрный, сетка → белая вспышка.
type BlurThroughProps = {color: string};
const BlurThroughView: React.FC<P<BlurThroughProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  if (presentationDirection === 'exiting') {
    const k = interpolate(p, [0, 0.6], [0, 1], {...clamp, easing: inn});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `blur(${k * 26}px)`, transform: `translateY(${-k * 70}px) scale(${1 + k * 0.05})`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: passedProps.color, opacity: interpolate(p, [0.15, 0.6], [0, 1], clamp)}} />
      </AbsoluteFill>
    );
  }
  const k = interpolate(p, [0.45, 1], [0, 1], {...clamp, easing: out});
  return <AbsoluteFill style={{opacity: k, filter: `blur(${(1 - k) * 18}px)`, transform: `scale(${1.03 - k * 0.03})`}}>{children}</AbsoluteFill>;
};
export const blurThrough = (props: BlurThroughProps): TransitionPresentation<BlurThroughProps> => ({component: BlurThroughView, props});

// Вспышка цвета следующей сцены: свечение растёт из точки поверх уходящей, потом новая сцена наезжает.
// Референс: фигура в балаклаве → фиолетовое свечение → сцена с ключом.
type BloomProps = {color: string; x?: number; y?: number};
const BloomView: React.FC<P<BloomProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const {color, x = W / 2, y = H * 0.55} = passedProps;
  if (presentationDirection === 'exiting') {
    const glow = interpolate(p, [0, 0.55], [0, 1], {...clamp, easing: out});
    const k = interpolate(p, [0.35, 0.8], [0, 1], {...clamp, easing: inn});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `blur(${k * 16}px)`, transform: `scale(${1 + k * 0.08})`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: glow,
          background: `radial-gradient(${600 + glow * 1400}px ${600 + glow * 1400}px at ${x}px ${y}px, ${color} 0%, ${color}AA 30%, ${color}00 70%)`}} />
      </AbsoluteFill>
    );
  }
  const k = interpolate(p, [0.5, 1], [0, 1], {...clamp, easing: out});
  return <AbsoluteFill style={{opacity: k, filter: `blur(${(1 - k) * 14}px)`, transform: `scale(${1.06 - k * 0.06})`}}>{children}</AbsoluteFill>;
};
export const bloom = (props: BloomProps): TransitionPresentation<BloomProps> => ({component: BloomView, props});

// Рывок камеры вбок: обе сцены едут одной лентой, размытие только по оси движения и сильнее всего в середине хода.
// SVG-фильтр, а не CSS blur: CSS размывает во все стороны. Референс: ключ улетает вбок, фиолетовый фон сменяется чёрным.
type WhipProps = {dir?: 'left' | 'right' | 'up' | 'down'};
const WhipView: React.FC<P<WhipProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const dir = passedProps.dir ?? 'right';
  const horiz = dir === 'left' || dir === 'right';
  const span = horiz ? W : H;
  const sign = dir === 'right' || dir === 'down' ? -1 : 1;
  const e = Easing.bezier(0.7, 0, 0.3, 1)(p);
  const shift = presentationDirection === 'exiting' ? sign * e * span : -sign * (1 - e) * span;
  const blur = Math.sin(Math.PI * p) * 70;
  const id = `whip-${presentationDirection}`;
  return (
    <AbsoluteFill style={{transform: `translate(${horiz ? shift : 0}px, ${horiz ? 0 : shift}px)`, filter: blur > 0.5 ? `url(#${id})` : undefined}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={horiz ? `${blur} 0` : `0 ${blur}`} /></filter>
      </svg>
      {children}
    </AbsoluteFill>
  );
};
export const whip = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({component: WhipView, props});

// Портал: камера влетает в окно предмета (иллюминатор, экран телефона), нутро становится следующей сценой.
// Окно задаётся прямоугольником в координатах кадра. Уходящая сцена растёт вокруг центра окна,
// новая видна сквозь маску той же формы, которая растёт вместе с ней до краёв кадра.
type PortalProps = {x: number; y: number; w: number; h: number; r: number};
const PortalView: React.FC<P<PortalProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const {x, y, w, h, r} = passedProps;
  const cx = x + w / 2, cy = y + h / 2;
  // Масштаб, при котором окно накрывает кадр с запасом, отсчитывая от центра окна.
  const cover = Math.max((Math.max(cx, W - cx) * 2) / w, (Math.max(cy, H - cy) * 2) / h) * 1.08;
  const k = interpolate(p, [0, 1], [0, 1], {...clamp, easing: Easing.bezier(0.55, 0, 0.3, 1)});
  const s = 1 + (cover - 1) * k;
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{transformOrigin: `${cx}px ${cy}px`, transform: `scale(${s})`, filter: `blur(${k * 14}px)`}}>{children}</AbsoluteFill>
    );
  }
  const L = cx - (w / 2) * s, T = cy - (h / 2) * s;
  const inset = `inset(${T}px ${W - (L + w * s)}px ${H - (T + h * s)}px ${L}px round ${r * s}px)`;
  return <AbsoluteFill style={{clipPath: k >= 0.999 ? undefined : inset, opacity: interpolate(p, [0, 0.3], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};
export const portal = (props: PortalProps): TransitionPresentation<PortalProps> => ({component: PortalView, props});

// Уход вверх с затемнением: сцена уезжает вверх и гаснет в чёрный, новая проявляется из тёмного.
// Референс: тогл «автомат» → чёрная сцена базы знаний.
const LiftView: React.FC<P<Record<string, never>>> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') {
    const k = interpolate(p, [0, 0.65], [0, 1], {...clamp, easing: inn});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{transform: `translateY(${-k * H * 0.3}px)`, filter: `blur(${k * 10}px)`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: '#08090A', opacity: k}} />
      </AbsoluteFill>
    );
  }
  const k = interpolate(p, [0.55, 1], [0, 1], {...clamp, easing: out});
  return <AbsoluteFill style={{opacity: k, transform: `translateY(${(1 - k) * 80}px)`}}>{children}</AbsoluteFill>;
};
export const lift = (): TransitionPresentation<Record<string, never>> => ({component: LiftView, props: {}});

// Сцена сжимается в точку следующей схемы: герой становится узлом карты.
// Референс: ключ уменьшается, размывается и остаётся узлом на чёрном холсте.
type ShrinkProps = {x: number; y: number};
const ShrinkView: React.FC<P<ShrinkProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  if (presentationDirection === 'exiting') {
    const k = interpolate(p, [0, 0.7], [0, 1], {...clamp, easing: inn});
    return (
      <AbsoluteFill style={{transformOrigin: `${passedProps.x}px ${passedProps.y}px`, transform: `scale(${1 - k * 0.85})`,
        filter: `blur(${k * 12}px)`, opacity: 1 - interpolate(p, [0.5, 0.8], [0, 1], clamp)}}>{children}</AbsoluteFill>
    );
  }
  const k = interpolate(p, [0.45, 1], [0, 1], {...clamp, easing: out});
  return <AbsoluteFill style={{opacity: k, filter: `blur(${(1 - k) * 10}px)`}}>{children}</AbsoluteFill>;
};
export const shrinkTo = (props: ShrinkProps): TransitionPresentation<ShrinkProps> => ({component: ShrinkView, props});

// Нарезка полосами (по Parallax Strip Slider, hyperiux / 21st.dev; добавлено 19.09.2026 для ролика 21, фраза «он нарежет»).
// Новая сцена входит вертикальными полосами снизу волной слева направо. Один clip-path со многими
// прямоугольниками: сцена не копируется, видео внутри декодируется один раз.
// Правка 19.09.2026 (Александр: «видны обрывки кадров и мятные линии по краям»): входящая сцена не сдвигается (сдвиг вместе с маской
// открывал старый кадр у верхнего и нижнего края), уходящая не сжимается (у бортов открывался пустой фон), линий по кромкам нет,
// полосы идут одной волной, а не вразнобой сверху и снизу — вразнобой середина стыка читалась как рваные обрывки.
type StripCutProps = {strips?: number};
const StripCutView: React.FC<P<StripCutProps>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const n = passedProps.strips ?? 6;
  const sw = W / n;
  if (presentationDirection === 'exiting') {
    // уходящая сцена стоит на месте и чуть темнеет под полосами
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#000', opacity: interpolate(p, [0, 1], [0, 0.35], clamp)}} />
      </AbsoluteFill>
    );
  }
  const rects = Array.from({length: n}, (_, i) => {
    const k = interpolate(p, [i * 0.07, i * 0.07 + 0.55], [0, 1], {...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1)});
    const h = k >= 1 ? H + 2 : H * k, x = Math.floor(i * sw), y = H + 1 - h;
    return `M ${x} ${y} H ${Math.ceil((i + 1) * sw) + 1} V ${y + h} H ${x} Z`;
  }).join(' ');
  return <AbsoluteFill style={{clipPath: `path('${rects}')`}}>{children}</AbsoluteFill>;
};
export const stripCut = (props: StripCutProps = {}): TransitionPresentation<StripCutProps> => ({component: StripCutView, props});
