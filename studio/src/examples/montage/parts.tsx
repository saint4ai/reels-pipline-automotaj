import {Easing, Img, interpolate, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import {textDepth} from '../../ds/tokens';
import {LiquidPanel, type LiquidProps} from '../../kit/liquid/LiquidPanel';
import {useFontsReady} from '../../kit/liquid/useAssetReady';
import {fontSpec, textWidth} from '../../kit/liquid/words';

// Общие детали ролика 21: текст с объёмом и входом из размытия, пилюли по ширине текста, рамка с уголками,
// счётчик, стеклянный телефон с настоящим кадром. Минимумы 2K: текст ≥ 43 px, подписи и заголовки ≥ 59 px.
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  acc: Easing.bezier(0.5, 0, 0.75, 0),
};
export const k = (t: number, a: number, b: number, e = E.out) => interpolate(t, [a, b], [0, 1], {...cl, easing: e});
export const C = {ink: '#F7F7F5', dark: '#101214', mint: '#3DEDC3', mintInk: '#05231D', orange: '#FF7A2F', dim: '#B9BDBF'};
export const SANS = 'Manrope', NUM = 'Inter Tight', MONO = 'JBM', HAND = 'Caveat';

// Текст: вход из размытия с подъёмом, уход — растворение. x — по align.
export const Txt: React.FC<{t: number; at: number; out?: number; x: number; y: number; size: number; weight?: number; family?: string; color?: string;
  align?: 'left' | 'center' | 'right'; track?: number; depth?: boolean; children: React.ReactNode; style?: React.CSSProperties}> =
  ({t, at, out, x, y, size, weight = 800, family = SANS, color = C.ink, align = 'left', track = -0.03, depth = true, children, style}) => {
    const a = k(t, at, at + 0.4);
    const o = out !== undefined ? 1 - k(t, out, out + 0.3, E.inOut) : 1;
    if (a <= 0 || o <= 0) return null;
    const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, ${(1 - a) * 26}px)`, opacity: a * o, filter: a < 1 ? `blur(${(1 - a) * 12}px)` : undefined,
        fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1.05, letterSpacing: `${track}em`, color, whiteSpace: 'nowrap',
        textShadow: depth ? (color === C.dark ? '0 2px 0 rgba(255,255,255,.6), 0 10px 24px rgba(0,0,0,.12)' : textDepth) : undefined, ...style}}>{children}</div>
    );
  };

// Пилюля по ширине своего текста (замер после загрузки шрифта). x — центр, если center, иначе левый край.
export const Chip: React.FC<{t: number; at: number; out?: number; x: number; y: number; label: string; size?: number; weight?: number; icon?: string; iconSize?: number;
  center?: boolean; glass?: Omit<LiquidProps, 'x' | 'y' | 'w' | 'h'>; color?: string; family?: string; children?: React.ReactNode}> =
  ({t, at, out, x, y, label, size = 59, weight = 700, icon, iconSize, center = true, glass, color, family = SANS, children}) => {
    const font = fontSpec(weight, size, family);
    const ready = useFontsReady([font]);
    if (!ready) return null;
    const a = k(t, at, at + 0.45, E.pop), vis = k(t, at, at + 0.2) * (out !== undefined ? 1 - k(t, out, out + 0.3) : 1);
    if (vis <= 0) return null;
    const is = iconSize ?? size * 1.15;
    const padX = size * 0.75, gap = icon ? size * 0.36 : 0;
    const w = textWidth(label, font, size) + padX * 2 + (icon ? is + gap : 0);
    const h = size * 1.9;
    const left = center ? x - w / 2 : x;
    const tone = glass?.tone ?? 'dark';
    const ink = color ?? (tone === 'mint' ? C.mintInk : tone === 'light' ? C.dark : C.ink);
    return (
      <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: vis, pointerEvents: 'none',
        transformOrigin: `${left + w / 2}px ${y + h / 2}px`, transform: `scale(${0.7 + 0.3 * a})`}}>
        <LiquidPanel material="frosted" {...glass} x={left} y={y} w={w} h={h} r="pill">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap, height: '100%', padding: `0 ${padX}px`}}>
            {icon ? (icon.startsWith('mark:') ? <Mark name={icon.slice(5)} size={is} /> : <Img src={staticFile(icon)} style={{width: is, height: is, objectFit: 'contain', flex: 'none'}} />) : null}
            <span style={{fontFamily: family, fontWeight: weight, fontSize: size, color: ink, whiteSpace: 'nowrap', letterSpacing: '-0.01em',
              textShadow: tone === 'dark' ? textDepth : 'none'}}>{label}</span>
            {children}
          </div>
        </LiquidPanel>
      </div>
    );
  };

// Рамка с уголками вокруг числа (паттерн 7): уголки съезжаются к рамке, когда число фиксируется.
export const Bracket: React.FC<{t: number; at: number; x: number; y: number; w: number; h: number; color?: string; len?: number; th?: number}> =
  ({t, at, x, y, w, h, color = C.mint, len = 56, th = 7}) => {
    const a = k(t, at, at + 0.5, E.inOut);
    if (a <= 0) return null;
    const off = (1 - a) * 60;
    const corner = (cx: number, cy: number, sx: number, sy: number) => (
      <div style={{position: 'absolute', left: cx - (sx < 0 ? len : 0) + sx * -off, top: cy - (sy < 0 ? len : 0) + sy * -off, width: len, height: len,
        borderLeft: sx > 0 ? `${th}px solid ${color}` : undefined, borderRight: sx < 0 ? `${th}px solid ${color}` : undefined,
        borderTop: sy > 0 ? `${th}px solid ${color}` : undefined, borderBottom: sy < 0 ? `${th}px solid ${color}` : undefined,
        opacity: a, filter: `drop-shadow(0 0 10px ${color}88)`}} />
    );
    return <>{corner(x, y, 1, 1)}{corner(x + w, y, -1, 1)}{corner(x, y + h, 1, -1)}{corner(x + w, y + h, -1, -1)}</>;
  };

// Число, которое перебирается и фиксируется: от from до to на отрезке a…b, с разрядами через тонкий пробел.
export const countTo = (t: number, a: number, b: number, to: number, from = 0, ease: (v: number) => number = E.out) => {
  const v = Math.round(from + (to - from) * k(t, a, b, ease));
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
};

// Настоящий логотип сервиса из public/brand.
export const Logo: React.FC<{name: string; size: number; style?: React.CSSProperties}> = ({name, size, style}) => (
  <Img src={staticFile(`brand/${name}.svg`)} style={{width: size, height: size, objectFit: 'contain', ...style}} />
);

// Стеклянный телефон: рамка-стекло с кадром ролика внутри (картинка или клип без звука).
export const Phone: React.FC<{x: number; y: number; w: number; src: string; video?: boolean; startFrom?: number; glass?: boolean; style?: React.CSSProperties}> =
  ({x, y, w, src, video, startFrom = 0, glass = true, style}) => {
    const h = w * (16 / 9) + w * 0.08, pad = w * 0.04, r = w * 0.14;
    const media: React.CSSProperties = {position: 'absolute', left: pad, top: pad, width: w - pad * 2, height: h - pad * 2, borderRadius: r - pad, objectFit: 'cover', overflow: 'hidden'};
    const inner = video
      ? <div style={media}><Video src={staticFile(src)} muted trimBefore={startFrom} objectFit="cover" style={{width: '100%', height: '100%'}} /></div>
      : <Img src={staticFile(src)} style={media} />;
    if (glass) {
      return <LiquidPanel x={x} y={y} w={w} h={h} r={r} material="clear" moon={0.8} level={3} style={style}>{inner}</LiquidPanel>;
    }
    return (
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: 'linear-gradient(145deg, #2A2D31, #0E0F11)',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25), inset 0 -3px 0 rgba(0,0,0,.5), 0 30px 70px rgba(0,0,0,.55)', ...style}}>{inner}</div>
    );
  };

// Знак сервиса, перекрашенный маской в фирменный цвет (у SVG Claude и Instagram нет заливки — на тёмном стекле он чёрный).
const BRAND: Record<string, string> = {
  claude: '#D97757', github: '#FFFFFF', 'github-dark': '#181717', telegram: '#26A5E4', pinterest: '#E60023',
  instagram: 'radial-gradient(circle at 30% 107%, #FDF497 0%, #FDF497 5%, #FD5949 45%, #D6249F 60%, #285AEB 90%)',
};
export const Mark: React.FC<{name: string; size: number; color?: string; style?: React.CSSProperties}> = ({name, size, color, style}) => {
  const file = name === 'github-dark' ? 'github' : name;
  const url = staticFile(`brand/${file}.svg`);
  return <span style={{display: 'block', flex: 'none', width: size, height: size, background: color ?? BRAND[name] ?? '#fff', WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`,
    WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', ...style}} />;
};
